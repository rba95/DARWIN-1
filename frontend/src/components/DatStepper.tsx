import { useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { downloadDat, previewDat, ExportFormat } from "../api/client";
import {
  DatFormValues,
  defaultDatFormValues,
  defaultActeur,
  defaultVM
} from "../types/dat";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  Check,
  Info,
  Users,
  Layers,
  Server,
  Settings,
  RefreshCw,
  Link2,
  ClipboardList,
  CheckCircle,
  Eye,
  FileText,
  File,
  X
} from "lucide-react";

// Import des composants de table
import { ActorsTable } from "./features/ActorsTable";
import { VMTable } from "./features/VMTable";
import { BriquesTable } from "./features/BriquesTable";
import { EchangesTable } from "./features/EchangesTable";
import { TechStackPanel } from "./features/TechStackPanel";
import { DnsTable } from "./features/DnsTable";
import { DependancesTable } from "./features/DependancesTable";
import { DocumentsReferenceTable, GlossaireTable } from "./features/DocumentsTable";
import { RichTextEditor } from "./features/RichTextEditor";

// Définition des étapes
const STEPS = [
  { id: 1, name: "Introduction", icon: Info, description: "Informations générales" },
  { id: 2, name: "Acteurs", icon: Users, description: "Acteurs du système" },
  { id: 3, name: "Fonctionnel", icon: Layers, description: "Spécifications fonctionnelles" },
  { id: 4, name: "Technique", icon: Settings, description: "Architecture technique" },
  { id: 5, name: "Infrastructure", icon: Server, description: "Ressources et VMs" },
  { id: 6, name: "Cycle de vie", icon: RefreshCw, description: "Déploiement et supervision" },
  { id: 7, name: "Dépendances", icon: Link2, description: "Dépendances externes" },
  { id: 8, name: "Contraintes", icon: ClipboardList, description: "Contraintes et SLA" },
  { id: 9, name: "Validation", icon: CheckCircle, description: "Vérification et génération" },
];



export function DatStepper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('docx');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const methods = useForm<DatFormValues>({
    defaultValues: {
      ...defaultDatFormValues,
      acteurs: [{ ...defaultActeur }],
      vms: [{ ...defaultVM }],
    }
  });

  const { watch, control } = methods;
  const formData = watch();

  const generateDocument = async (format: ExportFormat) => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const data = methods.getValues();

      // Générer le document (DOCX/PDF/ODT) — aucune donnée n'est sauvegardée sur le serveur
      const blob = await downloadDat(data, format);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;

      const extension = format;
      link.setAttribute('download', `DAT_${data.titre_projet || 'document'}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: unknown) {
      console.error('Erreur génération:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status: number; data?: unknown } };
        if (axiosErr.response?.status === 422) {
          setError('Données invalides. Veuillez vérifier les champs obligatoires.');
        } else {
          setError(`Erreur serveur (${axiosErr.response?.status}). Veuillez réessayer.`);
        }
      } else {
        setError('Erreur réseau. Vérifiez votre connexion.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const showPreview = async () => {
    setIsPreviewing(true);
    setError(null);

    try {
      const data = methods.getValues();
      const url = await previewDat(data);
      setPreviewUrl(url);
    } catch (err: unknown) {
      console.error('Erreur preview:', err);
      setError('Impossible de générer la prévisualisation. Vérifiez que LibreOffice est installé sur le serveur.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calcul du pourcentage de completion
  const completionPercentage = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#000091]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-[#000091] leading-tight">
                  Darwin
                </h1>
                <p className="text-sm text-gray-500">
                  {formData.titre_projet || "Nouveau projet"}
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-500">Progression :</span>
              <div className="w-40 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div
                  className="h-full bg-[#000091] transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[#000091]">{completionPercentage}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col border-4 border-[#000091]">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#000091] bg-gray-50">
              <h3 className="text-lg font-bold text-[#000091]">Prévisualisation du document</h3>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={previewUrl}
                className="w-full h-full rounded border-2 border-gray-300"
                title="Prévisualisation PDF"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">

          {/* Sidebar Navigation - Vertical Steps */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <nav className="bg-[#000091] rounded-xl p-3 sticky top-8 shadow-lg border border-gray-200">
              <h2 className="!text-white font-bold uppercase tracking-wide mb-4 px-2">
                Section
              </h2>
              <ul className="space-y-2 !text-white">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  // Définition propre des classes pour éviter les bugs Tailwind
                  let buttonClass = "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ";
                  let circleClass = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ";
                  let titleClass = "font-semibold truncate transition-colors ";
                  let descClass = "text-xs truncate transition-colors ";
                  let iconClass = "w-5 h-5 flex-shrink-0 transition-colors ";

                  if (isActive) {
                    buttonClass += "!bg-white shadow-md";
                    circleClass += "!bg-[#000091] !text-white";
                    titleClass += "!text-[#000091]";
                    descClass += "!text-[#000091]/80";
                    iconClass += "!text-[#000091]";
                  } else if (isCompleted) {
                    buttonClass += "!bg-green-600 !hover:bg-green-700 shadow-md";
                    circleClass += "!bg-white !text-green-700";
                    titleClass += "!text-white";
                    descClass += "!text-white/80";
                    iconClass += "!text-white";
                  } else {
                    // C'est ici que la magie du survol opère : hover:bg-[#000091]
                    buttonClass += "bg-transparent !hover:bg-white";
                    circleClass += "!bg-[#000091] !text-white group-hover:!bg-[#000091] group-hover:text-[#000091]";
                    titleClass += "!text-white group-hover:!text-[#000091]";
                    descClass += "!text-white/80 group-hover:!text-[#000091]/80";
                    iconClass += "!text-white group-hover:!text-[#000091]";
                  }

                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => goToStep(step.id)}
                        className={buttonClass}
                      >
                        {/* Cercle avec numéro ou icône Check */}
                        <div className={circleClass}>
                          {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                        </div>

                        {/* Textes (Titre et description) */}
                        <div className="flex-1 min-w-0">
                          <div className={titleClass}>
                            {step.name}
                          </div>
                          <div className={descClass}>
                            {step.description}
                          </div>
                        </div>

                        {/* Icône de droite */}
                        <Icon className={iconClass} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Mobile Step Selector */}
          <div className="lg:hidden mb-6 w-full">
            <select
              value={currentStep}
              onChange={(e) => goToStep(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border-2 border-[#000091] rounded-lg text-gray-800 font-medium focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              {STEPS.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.id}. {step.name} {currentStep > step.id ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <FormProvider {...methods}>
              <form onSubmit={(e) => e.preventDefault()}>

                {/* Step Content Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
                  {/* Step Header */}
                  <div className="px-8 py-6 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const StepIcon = STEPS[currentStep - 1]?.icon || Info;
                        return (
                          <div className="w-12 h-12 rounded-lg bg-[#000091] flex items-center justify-center flex-shrink-0">
                            <StepIcon className="w-6 h-6 text-white" />
                          </div>
                        );
                      })()}
                      <div>
                        <div className="text-sm text-gray-500 font-medium">
                          Étape {currentStep} sur {STEPS.length}
                        </div>
                        <h2 className="text-2xl font-bold text-[#000091]">
                          {STEPS[currentStep - 1]?.name}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          {STEPS[currentStep - 1]?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="p-8">
                    {renderStepContent(currentStep, methods, control, {
                      selectedFormat,
                      setSelectedFormat,
                      generateDocument,
                      showPreview,
                      isGenerating,
                      isPreviewing,
                      success,
                      error
                    })}
                  </div>
                </div>

                {/* Error / Success Messages (sauf étape 9) */}
                {currentStep !== 9 && error && (
                  <div className="mt-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-600">Erreur :</span>
                      <span className="text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className={`
                      inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all border-2
                      ${currentStep === 1
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-[#000091] border-[#000091] hover:bg-blue-50'
                      }
                    `}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Précédent
                  </button>

                  {currentStep < STEPS.length && (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-[#000091] text-white rounded-lg font-semibold hover:bg-[#1212FF] transition-all border-2 border-[#000091]"
                    >
                      Suivant
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </FormProvider>
          </main>
        </div>
      </div>
    </div>
  );
}

// Composant Input personnalisé avec bordure grise
function FormInput({
  label,
  name,
  register,
  placeholder,
  required = false,
  type = "text"
}: {
  label: string;
  name: string;
  register: ReturnType<typeof useForm<DatFormValues>>['register'];
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        {...register(name as keyof DatFormValues)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#000091] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
      />
    </div>
  );
}

interface Step9Props {
  selectedFormat: ExportFormat;
  setSelectedFormat: (format: ExportFormat) => void;
  generateDocument: (format: ExportFormat) => Promise<void>;
  showPreview: () => Promise<void>;
  isGenerating: boolean;
  isPreviewing: boolean;
  success: boolean;
  error: string | null;
}

// Rendu du contenu de chaque étape
function renderStepContent(
  step: number,
  methods: ReturnType<typeof useForm<DatFormValues>>,
  control: ReturnType<typeof useForm<DatFormValues>>['control'],
  step9Props?: Step9Props
) {
  const { register, watch } = methods;

  switch (step) {
    case 1: // Introduction
      return (
        <div className="space-y-8">
          {/* Informations générales */}
          <div className="grid md:grid-cols-2 gap-6">
            <FormInput
              label="Titre du projet"
              name="titre_projet"
              register={register}
              placeholder="Ex: Application de gestion RH"
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Date du document
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full px-4 py-3 bg-white border-2 border-[#000091] rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              />
            </div>
            <FormInput
              label="Chef de projet"
              name="chef_projet"
              register={register}
              placeholder="Nom du chef de projet"
              required
            />
            <FormInput
              label="Contact technique"
              name="contact_tech"
              register={register}
              placeholder="Email ou téléphone"
            />
          </div>

          <Controller
            name="objet_document"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Objet du document"
                value={field.value}
                onChange={field.onChange}
                placeholder="Décrivez l'objet et le périmètre de ce document d'architecture technique..."
                rows={4}
              />
            )}
          />

          {/* Documents de référence & Glossaire */}
          <div className="space-y-8 pt-6 border-t-2 border-[#000091]">
            <DocumentsReferenceTable />
            <GlossaireTable />
          </div>
        </div>
      );

    case 2: // Acteurs
      return <ActorsTable />;

    case 3: // Fonctionnel
      return (
        <div className="space-y-8">
          {/* Schéma fonctionnel */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 border-[#000091]">
              <input
                type="checkbox"
                {...register("has_schema")}
                id="has_schema"
                className="w-5 h-5 accent-[#000091] rounded"
              />
              <label htmlFor="has_schema" className="font-medium text-gray-700">
                Inclure un schéma fonctionnel
              </label>
            </div>

            {watch("has_schema") && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-blue-800">
                  Les images de schémas doivent être ajoutées manuellement dans le document Word après génération.
                </p>
              </div>
            )}

            <Controller
              name="schema_description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label="Description fonctionnelle"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Décrivez le fonctionnement global de l'application, les flux principaux..."
                  rows={5}
                />
              )}
            />
          </div>

          {/* Briques fonctionnelles */}
          <BriquesTable />

          {/* Échanges de données */}
          <EchangesTable />
        </div>
      );

    case 4: // Technique
      return (
        <div className="space-y-8">
          <Controller
            name="description_architecture"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Description de l'architecture"
                value={field.value}
                onChange={field.onChange}
                placeholder="Décrivez l'architecture technique de l'application (tiers, composants, interactions)..."
                rows={5}
              />
            )}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <Controller
              name="description_authentification"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label="Authentification"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Mécanismes d'authentification utilisés..."
                  rows={4}
                />
              )}
            />
            <Controller
              name="description_administrationtechnique"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label="Administration technique"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Gestion des droits, accès techniques..."
                  rows={4}
                />
              )}
            />
            <Controller
              name="description_adminfonctionnelle"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label="Administration fonctionnelle"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Gestion des droits utilisateurs, habilitations..."
                  rows={4}
                />
              )}
            />
            <Controller
              name="description_interapplicative"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label="Administration inter-applicative"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Échanges et interactions entre applications..."
                  rows={4}
                />
              )}
            />
          </div>

          {/* Stack Technologique */}
          <TechStackPanel />

          {/* Segmentation */}
          <div className="p-5 bg-gray-50 rounded-lg border-2 border-[#000091]">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Données sensibles / DR
            </label>
            <select
              {...register("segmentation_dr")}
              className="w-full md:w-auto px-4 py-3 bg-white border-2 border-[#000091] rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="Non">Non - Pas de données sensibles</option>
              <option value="Oui">Oui - Données DR ou sensibles</option>
            </select>
          </div>

          {/* DNS */}
          <DnsTable />
        </div>
      );

    case 5: // Infrastructure
      return <VMTable />;

    case 6: // Cycle de vie
      return (
        <div className="space-y-6">
          <Controller
            name="deploiement"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Déploiement"
                value={field.value}
                onChange={field.onChange}
                placeholder="Décrivez la stratégie de déploiement (CI/CD, environnements, processus)..."
                rows={5}
              />
            )}
          />
          <Controller
            name="migration_reprise"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Migration / Reprise de données"
                value={field.value}
                onChange={field.onChange}
                placeholder="Plan de migration des données existantes, stratégie de reprise..."
                rows={5}
              />
            )}
          />
          <Controller
            name="supervision"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Supervision et observabilité"
                value={field.value}
                onChange={field.onChange}
                placeholder="Outils de monitoring, alerting, métriques collectées..."
                rows={5}
              />
            )}
          />
          <Controller
            name="sauvegarde_restauration"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Sauvegardes et restauration"
                value={field.value}
                onChange={field.onChange}
                placeholder="Politique de backup, rétention, procédure de restauration..."
                rows={5}
              />
            )}
          />
        </div>
      );

    case 7: // Dépendances
      return <DependancesTable />;

    case 8: // Contraintes
      return (
        <div className="space-y-6">
          <Controller
            name="contraintes"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Contraintes spécifiques"
                value={field.value}
                onChange={field.onChange}
                placeholder="Contraintes techniques, réglementaires, organisationnelles à prendre en compte..."
                rows={6}
              />
            )}
          />
          <Controller
            name="niveau_services"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Niveau de service attendu (SLA)"
                value={field.value}
                onChange={field.onChange}
                placeholder="Disponibilité attendue, temps de réponse, GTR/GTI..."
                rows={6}
              />
            )}
          />
        </div>
      );

    case 9: // Validation
      if (!step9Props) return null;

      const {
        selectedFormat,
        setSelectedFormat,
        generateDocument,
        showPreview,
        isGenerating,
        isPreviewing,
        success,
        error
      } = step9Props;

      return (
        <div className="space-y-8">
          {/* Résumé du document */}
          <div className="p-6 bg-blue-50 rounded-lg border-2 border-[#000091]">
            <h3 className="text-lg font-bold text-[#000091] mb-4">Résumé du document</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-blue-300">
                <span className="text-gray-600">Projet :</span>
                <span className="font-semibold text-gray-900">{watch("titre_projet") || "Non renseigné"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-300">
                <span className="text-gray-600">Chef de projet :</span>
                <span className="font-semibold text-gray-900">{watch("chef_projet") || "Non renseigné"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-300">
                <span className="text-gray-600">Acteurs définis :</span>
                <span className="font-semibold text-[#000091]">{watch("acteurs")?.filter(a => a.acteur).length || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-300">
                <span className="text-gray-600">VMs définies :</span>
                <span className="font-semibold text-[#000091]">{watch("vms")?.filter(v => v.nom).length || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-300">
                <span className="text-gray-600">Briques fonctionnelles :</span>
                <span className="font-semibold text-[#000091]">{watch("briques_fonctionnelles")?.length || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-300">
                <span className="text-gray-600">Technologies :</span>
                <span className="font-semibold text-[#000091]">{watch("choix_technologiques")?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Choix du format */}
          <div className="p-6 bg-white rounded-lg border-2 border-[#000091]">
            <h4 className="font-bold text-[#000091] mb-4">Format d'export</h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'docx' as ExportFormat, label: 'Word (.docx)', icon: FileText, color: 'blue' },
                { value: 'pdf' as ExportFormat, label: 'PDF (.pdf)', icon: File, color: 'red' },
                { value: 'odt' as ExportFormat, label: 'OpenDocument (.odt)', icon: FileText, color: 'green' },
              ].map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.value;

                return (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => setSelectedFormat(format.value)}
                    className={`
                      p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                      ${isSelected
                        ? 'border-[#000091] bg-blue-50 shadow-md'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <Icon className={`w-8 h-8 ${isSelected ? 'text-[#000091]' : 'text-gray-400'}`} />
                    <span className={`font-medium text-sm text-center ${isSelected ? 'text-[#000091]' : 'text-gray-600'}`}>
                      {format.label}
                    </span>
                    {isSelected && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Prévisualiser */}
            <button
              type="button"
              onClick={showPreview}
              disabled={isPreviewing}
              className={`
                flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all border-2
                ${isPreviewing
                  ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-wait'
                  : 'bg-white text-[#000091] border-[#000091] hover:bg-blue-50'
                }
              `}
            >
              {isPreviewing ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#000091] border-t-transparent rounded-full animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Prévisualiser (PDF)
                </>
              )}
            </button>

            {/* Générer */}
            <button
              type="button"
              onClick={() => generateDocument(selectedFormat)}
              disabled={isGenerating}
              className={`
                flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all
                ${isGenerating
                  ? 'bg-gray-400 text-white cursor-wait'
                  : 'bg-green-600 text-white hover:bg-green-700'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  Télécharger ({selectedFormat.toUpperCase()})
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-start gap-3">
                <span className="font-bold text-red-600">Erreur :</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-5 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-500" />
                <span className="font-bold text-green-700">Document généré et téléchargé avec succès !</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-5 bg-amber-50 rounded-lg border-2 border-amber-400">
            <h4 className="font-bold text-amber-800 mb-3">Informations :</h4>
            <ul className="list-disc list-inside space-y-2 text-amber-700 text-sm">
              <li><strong>Word (.docx)</strong> : Format éditable, recommandé pour modifications ultérieures</li>
              <li><strong>PDF</strong> : Format figé, idéal pour diffusion et archivage</li>
              <li><strong>OpenDocument (.odt)</strong> : Format ouvert, compatible LibreOffice</li>
              <li>La prévisualisation génère un aperçu PDF dans une nouvelle fenêtre</li>
            </ul>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export default DatStepper;