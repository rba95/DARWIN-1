import { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { DatFormValues } from "../../types/dat";
import {
  Plus,
  Trash2,
  Cpu,
  Check,
  X,
  AlertTriangle,
  Info,
  Search,
  Package,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CATALOGUE CCTMI / RDSI (référence uniquement)
   ═══════════════════════════════════════════════════════════════ */

interface RecommendedTech {
  nom: string;
  categorie: string;
  version?: string;
  info?: string;
  frameworks?: string[];
}

const CATALOGUE_CCTMI: RecommendedTech[] = [
  { nom: "Debian", categorie: "Systèmes d'exploitation", version: "13", info: "STIG" },
  { nom: "SUSE Liberty Linux", categorie: "Systèmes d'exploitation", version: "9", info: "STIG" },
  { nom: "Gendbuntu", categorie: "Systèmes d'exploitation", version: "24.04", info: "STIG" },
  { nom: "Debian", categorie: "Systèmes d'exploitation", version: "12", info: "SHIVA et Autre" },
  { nom: "docker.io", categorie: "Conteneurs", info: "Moteur d'exécution de conteneur" },
  { nom: "podman", categorie: "Conteneurs", info: "Moteur d'exécution de conteneur" },
  { nom: "NGINX", categorie: "Serveurs Web" },
  { nom: "Apache HTTP Server", categorie: "Serveurs Web" },
  { nom: "Apache Tomcat", categorie: "Serveurs d'Application", info: "Filière Java" },
  { nom: "PHP FPM (sur NGINX)", categorie: "Serveurs PHP" },
  { nom: "Module PHP Apache", categorie: "Serveurs PHP" },
  { nom: "Drupal", categorie: "CMS", info: "Tout hébergement" },
  { nom: "Wordpress", categorie: "CMS", info: "SHIVA" },
  { nom: "EZ Publish", categorie: "CMS", info: "SHIVA" },
  { nom: "ElasticSearch", categorie: "Recherche & Indexation", info: "STIG et SHIVA" },
  { nom: "OpenSearch", categorie: "Recherche & Indexation", info: "STIG" },
  { nom: "OSS", categorie: "Recherche & Indexation", info: "STIG" },
  { nom: "PostgreSQL", categorie: "Bases de données relationnelles", version: "16", info: "STIG" },
  { nom: "MariaDB", categorie: "Bases de données relationnelles", version: "10", info: "STIG" },
  { nom: "SQLite", categorie: "Bases de données relationnelles", info: "STIG" },
  { nom: "PostgreSQL", categorie: "Bases de données relationnelles", info: "SHIVA et Autre" },
  { nom: "MariaDB", categorie: "Bases de données relationnelles", info: "SHIVA" },
  { nom: "InfluxDB", categorie: "Bases de données relationnelles", info: "SHIVA" },
  { nom: "MongoDB", categorie: "Bases de données NoSQL", info: "STIG, SHIVA, Autre" },
  { nom: "Redis", categorie: "Bases de données NoSQL", info: "STIG, SHIVA" },
  { nom: "Neo4j", categorie: "Bases de données NoSQL", info: "STIG" },
  { nom: "Javascript", categorie: "Couche Client Web", frameworks: ["React", "React Native", "Vue.js", "Redux", "Bootstrap", "OpenLayers", "Leaflet", "Angular", "Angular Design"] },
  { nom: "Java", categorie: "Langages", frameworks: ["Spring", "Hibernate", "Jersey", "CXF", "AXIS2", "Thymeleaf"] },
  { nom: "PHP", categorie: "Langages", frameworks: ["Symfony"] },
  { nom: "Node.js", categorie: "Langages" },
  { nom: "Python", categorie: "Langages" },
  { nom: "HA Proxy", categorie: "Technologies spécifiques SHIVA", info: "Loadbalancing" },
  { nom: "RabbitMQ", categorie: "Technologies spécifiques SHIVA", info: "Fils de messages" },
  { nom: "Varnish", categorie: "Technologies spécifiques SHIVA", info: "Cache HTTP" },
  { nom: "MemCached", categorie: "Technologies spécifiques SHIVA", info: "Cache de mémoire" },
];

const CATEGORIES_UNIQUES = [
  "Systèmes d'exploitation", "Conteneurs", "Serveurs Web", "Serveurs d'Application",
  "Serveurs PHP", "CMS", "Recherche & Indexation", "Bases de données relationnelles",
  "Bases de données NoSQL", "Couche Client Web", "Langages", "Technologies spécifiques SHIVA",
];

/** Vérifie si un choix est conforme au catalogue CCTMI */
function isConforme(produit: string, version: string): { conforme: boolean; match?: RecommendedTech } {
  const pLow = produit.trim().toLowerCase();
  // Exact name match
  const nameMatches = CATALOGUE_CCTMI.filter((t) => t.nom.toLowerCase() === pLow);
  if (nameMatches.length === 0) return { conforme: false };

  // Si aucune des entrées catalogue n'a de version → conforme quel que soit la version
  const withVersions = nameMatches.filter((t) => t.version);
  if (withVersions.length === 0) return { conforme: true, match: nameMatches[0] };

  // Vérifier si la version fournie correspond
  const vLow = version.trim().toLowerCase();
  const exactMatch = withVersions.find((t) => t.version!.toLowerCase() === vLow);
  if (exactMatch) return { conforme: true, match: exactMatch };

  // Nom trouvé mais version différente → non conforme
  return { conforme: false, match: withVersions[0] };
}

/* ═══════════════════════════════════════════════════════════════
   MODAL D'AJOUT
   ═══════════════════════════════════════════════════════════════ */

interface AddTechModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tech: { tiers: string; produit: string; version: string; justification: string }) => void;
}

function AddTechModal({ isOpen, onClose, onAdd }: AddTechModalProps) {
  const [produit, setProduit] = useState("");
  const [version, setVersion] = useState("");
  const [tiers, setTiers] = useState("");
  const [justification, setJustification] = useState("");

  // Recherche live dans le catalogue
  const matchingTechs = useMemo(() => {
    if (!produit.trim()) return [];
    const q = produit.trim().toLowerCase();
    return CATALOGUE_CCTMI.filter(
      (t) => t.nom.toLowerCase().includes(q) || q.includes(t.nom.toLowerCase())
    );
  }, [produit]);

  // Vérifier la conformité version
  const conformite = useMemo(() => {
    if (!produit.trim()) return null;
    return isConforme(produit, version);
  }, [produit, version]);

  // On exige une justification dès que la tech n'est pas conforme (version différente OU hors catalogue)
  const needsJustification = conformite !== null && !conformite.conforme;

  const handleSubmit = () => {
    if (!produit.trim() || !tiers.trim()) return;
    if (needsJustification && !justification.trim()) return;
    onAdd({
      tiers: tiers.trim(),
      produit: produit.trim(),
      version: version.trim() || "-",
      justification: justification.trim(),
    });
    setProduit("");
    setVersion("");
    setTiers("");
    setJustification("");
    onClose();
  };

  const selectMatchingTech = (tech: RecommendedTech) => {
    setProduit(tech.nom);
    setTiers(tech.categorie);
    if (tech.version) setVersion(tech.version);
    else setVersion("");
    setJustification("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#000091] to-[#1212FF] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="!text-base !font-bold !text-white">Ajouter une technologie</h3>
              <p className="!text-xs !text-blue-200">Tapez un nom pour voir les recommandations CCTMI/RDSI</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Nom */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nom du produit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={produit}
                onChange={(e) => setProduit(e.target.value)}
                placeholder="Commencez à taper… Ex: Debian, PostgreSQL, Redis"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:border-[#000091] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Suggestions live (cartes vertes) */}
          {matchingTechs.length > 0 && (
            <div className="rounded-xl border-2 border-green-300 bg-green-50/50 overflow-hidden">
              <div className="px-4 py-2 bg-green-500 flex items-center gap-2">
                <Check className="w-4 h-4 text-white" />
                <p className="!text-xs !font-bold !text-white uppercase tracking-wide">
                  Recommandations CCTMI/RDSI
                </p>
              </div>
              <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto">
                {matchingTechs.map((tech, idx) => (
                  <button
                    key={`match-${tech.nom}-${tech.version || ""}-${tech.info || ""}-${idx}`}
                    type="button"
                    onClick={() => selectMatchingTech(tech)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-green-200 hover:border-green-400 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="!text-sm !font-semibold !text-gray-900">{tech.nom}</span>
                        {tech.version && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-md">v{tech.version}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="!text-xs !text-gray-500">{tech.categorie}</span>
                        {tech.info && <span className="!text-xs !text-gray-400">· {tech.info}</span>}
                      </div>
                      {tech.frameworks && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tech.frameworks.slice(0, 5).map((fw) => (
                            <span key={fw} className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded border border-blue-100">{fw}</span>
                          ))}
                          {tech.frameworks.length > 5 && (
                            <span className="text-[10px] text-gray-400">+{tech.frameworks.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-green-500 flex-shrink-0">
                      Sélectionner
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Type de technologie <span className="text-red-500">*</span>
            </label>
            <select
              value={tiers}
              onChange={(e) => setTiers(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:border-[#000091] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
            >
              <option value="">Sélectionnez un type…</option>
              {CATEGORIES_UNIQUES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Version</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Ex: 13, 16, 3.2, latest…"
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:border-[#000091] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
            />
          </div>

          {/* ── Alerte version non conforme ── */}
          {needsJustification && (
            <div className="p-4 bg-red-50 border-2 border-red-400 rounded-xl animate-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="!text-sm !font-bold !text-red-800 mb-1">
                    {conformite?.match
                      ? "Attention — Cette version n'est pas conforme à la CCTMI/RDSI"
                      : "Attention — Cette technologie n'est pas référencée dans la CCTMI/RDSI"
                    }
                  </p>
                  <p className="!text-xs !text-red-700 leading-relaxed">
                    {conformite?.match ? (
                      <>La version recommandée pour <strong>{conformite.match.nom}</strong> est{" "}
                        <strong>v{conformite.match.version}</strong>
                        {conformite.match.info && <> ({conformite.match.info})</>}.
                        Veuillez justifier votre choix.</>
                    ) : (
                      <>La technologie <strong>{produit}</strong> ne figure pas dans le catalogue CCTMI/RDSI.
                        Veuillez justifier votre choix.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statut de conformité (indicateur vert si conforme) */}
          {conformite && conformite.conforme && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded-xl">
              <Check className="w-4 h-4 text-green-600" />
              <p className="!text-sm !text-green-700 !font-medium">
                ✓ Conforme à la CCTMI/RDSI
              </p>
            </div>
          )}

          {/* Justification — obligatoire si hors CCTMI/RDSI */}
          {needsJustification && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Justification <span className="text-red-500">* (obligatoire)</span>
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder={
                  conformite?.match
                    ? "Justifiez pourquoi vous avez besoin de cette version non conforme…"
                    : "Justifiez pourquoi cette technologie hors catalogue est nécessaire…"
                }
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-red-300 focus:border-red-500 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:outline-none transition-all resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!produit.trim() || !tiers.trim() || (needsJustification && !justification.trim())}
            className="px-5 py-2.5 text-sm font-semibold !text-white !bg-[#000091] rounded-xl hover:!bg-[#1212FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */

export function TechStackPanel() {
  const { setValue, watch, getValues } = useFormContext<DatFormValues>();
  const choixTechnologiques = watch("choix_technologiques") || [];

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ajout
  const handleAddTech = useCallback(
    (tech: { tiers: string; produit: string; version: string; justification: string }) => {
      const current = getValues("choix_technologiques") || [];
      setValue("choix_technologiques", [...current, tech], { shouldDirty: true });
    },
    [getValues, setValue]
  );

  // Suppression
  const removeTech = useCallback(
    (index: number) => {
      const current = getValues("choix_technologiques") || [];
      setValue("choix_technologiques", current.filter((_, i) => i !== index), { shouldDirty: true });
    },
    [getValues, setValue]
  );

  return (
    <div className="space-y-6">
      <AddTechModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddTech} />

      {/* ══════════ HEADER ══════════ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#000091] to-[#1212FF] p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h3 className="!text-xl !font-bold !text-white tracking-tight">Stack Technologique</h3>
            <p className="!text-sm !text-blue-200 mt-0.5">
              Ajoutez vos choix technologiques — conformité CCTMI/RDSI vérifiée automatiquement
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold !text-[#000091] !bg-white rounded-xl hover:!bg-blue-50 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Ajouter une technologie
          </button>
        </div>
      </div>

      {/* ══════════ INFO ══════════ */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="!text-sm !text-blue-700 leading-relaxed">
          Cliquez sur <strong>"Ajouter une technologie"</strong> pour rechercher et ajouter vos choix.
          Le catalogue <strong>CCTMI/RDSI</strong> apparaîtra en vert pour vous guider.
          Si votre version diffère de la recommandation, une justification sera demandée.
        </p>
      </div>

      {/* ══════════ LISTE DES TECHNOLOGIES CHOISIES ══════════ */}
      {choixTechnologiques.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="!text-base !font-semibold !text-gray-500 mb-2">Aucune technologie ajoutée</p>
          <p className="!text-sm !text-gray-400 mb-6">
            Commencez par ajouter les technologies de votre projet
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold !text-white !bg-[#000091] rounded-xl hover:!bg-[#1212FF] transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Ajouter une technologie
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="!text-sm !font-bold !text-gray-700">
              Technologies sélectionnées ({choixTechnologiques.length})
            </h4>
          </div>

          {choixTechnologiques.map((tech, idx) => {
            const { conforme, match } = isConforme(tech.produit, tech.version);
            const isAssujetti = !conforme || (tech.justification && tech.justification.trim() !== "");

            return (
              <div
                key={`tech-${idx}`}
                className={`group flex items-start gap-4 px-5 py-4 bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${isAssujetti ? "border-red-300" : "border-green-300"
                  }`}
              >
                {/* Icône status */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isAssujetti ? "bg-red-100" : "bg-green-100"
                  }`}>
                  {isAssujetti
                    ? <AlertTriangle className="w-5 h-5 text-red-600" />
                    : <Check className="w-5 h-5 text-green-600" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="!text-sm !font-bold !text-gray-900">{tech.produit}</span>
                    {tech.version && tech.version !== "-" && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${isAssujetti ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}>
                        v{tech.version}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-extrabold rounded-md border ${isAssujetti
                      ? "text-red-600 bg-red-50 border-red-200"
                      : "text-green-600 bg-green-50 border-green-200"
                      }`}>
                      {isAssujetti ? "Assujetti" : "Conforme CCTMI"}
                    </span>
                  </div>
                  <p className="!text-xs !text-gray-500 mt-0.5">{tech.tiers}</p>

                  {/* Justification visible */}
                  {tech.justification && tech.justification.trim() !== "" && (
                    <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="!text-xs !text-amber-800">
                        <strong>Justification :</strong> {tech.justification}
                      </p>
                    </div>
                  )}

                  {/* Info recommandation si conforme */}
                  {conforme && match && match.info && (
                    <p className="!text-xs !text-green-600 mt-1">
                      ✓ {match.info}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeTech(idx)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
