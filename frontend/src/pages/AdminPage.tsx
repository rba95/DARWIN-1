import { useState, useRef } from "react";
import { Upload, Download, Shield, CheckCircle, AlertCircle, LogOut, FileText } from "lucide-react";
import api from "../api/client";

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("darwin_admin_token") || "");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [status, setStatus] = useState<{ template_size_kb: number; template_name: string } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.get("/admin/status", { headers: { Authorization: `Bearer ${password}` } });
      setToken(password);
      sessionStorage.setItem("darwin_admin_token", password);
      setAuthenticated(true);
      setStatus(res.data);
    } catch {
      setMessage({ type: "error", text: "Mot de passe incorrect." });
    }
  };

  const logout = () => {
    setAuthenticated(false);
    setToken("");
    setPassword("");
    sessionStorage.removeItem("darwin_admin_token");
    setStatus(null);
  };

  const uploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".docx")) {
      setMessage({ type: "error", text: "Seul le format .docx est accepté." });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("/admin/upload-template", form, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });
      const res = await api.get("/admin/status", { headers: authHeader() });
      setStatus(res.data);
      setMessage({ type: "success", text: `Template « ${file.name} » mis à jour avec succès.` });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMessage({ type: "error", text: msg || "Erreur lors de l'upload." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get("/admin/download-template", {
        headers: authHeader(),
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "dat_template.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "error", text: "Erreur lors du téléchargement." });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      {/* Tricolor */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-[#002395]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#ED2939]" />
      </div>

      {/* Header */}
      <header className="bg-white border-b-4 border-[#000091] shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#000091] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#000091] leading-tight">DARWIN — Administration</h1>
              <p className="text-xs text-[#666666] uppercase tracking-wider">Gestion du template</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-[#000091] underline underline-offset-2 hover:text-[#1212FF]">
              ← Retour à l'application
            </a>
            {authenticated && (
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#CE0500] text-[#CE0500] text-sm font-medium hover:bg-[#FFE9E9] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Login */}
        {!authenticated ? (
          <div className="bg-white border border-[#E5E5E5] shadow-sm p-8">
            <h2 className="text-lg font-bold text-[#161616] mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#000091]" />
              Authentification
            </h2>
            <form onSubmit={login} className="space-y-4 max-w-sm">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#161616]">
                  Mot de passe administrateur
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F6F6F6] border-b-2 border-[#3A3A3A] text-[#161616] focus:border-[#000091] focus:bg-white focus:outline-none transition-colors"
                  placeholder="Mot de passe"
                  autoFocus
                />
              </div>
              {message && (
                <div className="flex items-center gap-2 text-[#CE0500] text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {message.text}
                </div>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#000091] text-white font-medium hover:bg-[#1212FF] transition-colors"
              >
                <Shield className="w-4 h-4" />
                Se connecter
              </button>
            </form>
            <p className="mt-6 text-xs text-[#666666]">
              Mot de passe par défaut : <code className="bg-[#EEEEEE] px-1">darwin-admin</code> — à changer via la variable d'environnement <code className="bg-[#EEEEEE] px-1">ADMIN_PASSWORD</code>.
            </p>
          </div>
        ) : (
          <>
            {/* Template status */}
            {status && (
              <div className="bg-white border border-[#E5E5E5] shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#161616] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#000091]" />
                  Template actuel
                </h2>
                <div className="flex items-center justify-between p-4 bg-[#F6F6F6] border border-[#E5E5E5]">
                  <div>
                    <p className="font-medium text-[#161616]">{status.template_name}</p>
                    <p className="text-sm text-[#666666]">{status.template_size_kb} Ko</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#000091] text-[#000091] text-sm font-medium hover:bg-[#F6F6F6] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                </div>
              </div>
            )}

            {/* Upload */}
            <div className="bg-white border border-[#E5E5E5] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#161616] mb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#000091]" />
                Mettre à jour le template
              </h2>
              <p className="text-sm text-[#666666] mb-4">
                Uploadez un fichier <code className="bg-[#EEEEEE] px-1">.docx</code> contenant les variables Jinja2. L'ancien template sera sauvegardé automatiquement.
              </p>

              <div
                className="border-2 border-dashed border-[#CECECE] p-8 text-center cursor-pointer hover:border-[#000091] hover:bg-[#F6F6F6] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-[#666666] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#161616]">Cliquez pour sélectionner un fichier .docx</p>
                <p className="text-xs text-[#666666] mt-1">ou glissez-déposez ici</p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={uploadTemplate}
                disabled={uploading}
              />

              {uploading && (
                <div className="mt-4 flex items-center gap-2 text-[#000091] text-sm">
                  <div className="w-4 h-4 border-2 border-[#000091] border-t-transparent rounded-full animate-spin" />
                  Upload en cours...
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-start gap-3 p-4 border-l-4 ${
                message.type === "success"
                  ? "bg-[#B8FEC9]/30 border-[#18753C]"
                  : "bg-[#FFE9E9] border-[#CE0500]"
              }`}>
                {message.type === "success"
                  ? <CheckCircle className="w-5 h-5 text-[#18753C] flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-5 h-5 text-[#CE0500] flex-shrink-0 mt-0.5" />
                }
                <p className={`text-sm font-medium ${message.type === "success" ? "text-[#18753C]" : "text-[#CE0500]"}`}>
                  {message.text}
                </p>
              </div>
            )}

            {/* Syntax reference */}
            <div className="bg-white border border-[#E5E5E5] shadow-sm p-6">
              <h2 className="text-base font-bold text-[#161616] mb-3">Variables disponibles dans le template</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-[#000091] mb-1">Texte simple <code>{"{{ variable }}"}</code></p>
                  <ul className="space-y-0.5 text-[#161616]">
                    {["titre_projet", "chef_projet", "contact_tech", "date", "segmentation_dr"].map(v => (
                      <li key={v}><code className="bg-[#F6F6F6] px-1">{`{{ ${v} }}`}</code></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[#000091] mb-1">Rich text <code>{"{{r variable }}"}</code></p>
                  <ul className="space-y-0.5 text-[#161616]">
                    {["objet_document", "description_architecture", "description_authentification", "deploiement", "supervision", "contraintes", "niveau_services"].map(v => (
                      <li key={v}><code className="bg-[#E3E3FD] px-1">{`{{r ${v} }}`}</code></li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#666666]">
                Les boucles utilisent la syntaxe Jinja2 : <code className="bg-[#F6F6F6] px-1">{"{% for vm in vms %}...{% endfor %}"}</code>
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
