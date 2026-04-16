/**
 * Types TypeScript pour le DAT (Dossier d'Architecture Technique)
 * Synchronisé avec le schéma Pydantic backend
 */

// === INTRODUCTION ===

export interface DocumentReference {
  emetteur: string;
  document: string;
  version: string;
}

export interface GlossaireItem {
  abreviation: string;
  signification: string;
}

// === SPÉCIFICATIONS FONCTIONNELLES ===

export interface Acteur {
  acteur: string;
  role: string;
  droits: string;
  commentaires: string;
}

export interface SchemaFonctionnel {
  titre: string;
  description: string;
  image: string;
}

export interface BriqueFonctionnelle {
  brique: string;
  description: string;
}

export interface EchangeDonnees {
  type_echange: string;
  brique_fonctionnelle: string;
  source: string;
  destination: string;
  type_donnees: string;
  volumetrie: string;
  volumetrie_journaliere: string;
  nb_fichiers_jour: string;
  frequence: string;
  hno: string;
}

// === SPÉCIFICATIONS TECHNIQUES ===

export interface ComposantPhysique {
  type_machine: string;
  environnement: string;
  cluster: string;
}

export interface FluxReseau {
  type_echange: string;
  brique_fonctionnelle: string;
  source: string;
  destination: string;
  description: string;
  type_flux: string;
}

export interface ChoixTechnologique {
  tiers: string;
  produit: string;
  version: string;
  justification: string;
}

export interface DnsNom {
  nom_dns: string;
  machine_associe: string;
}

// === DÉPENDANCES ===

export interface DependanceExterne {
  dependance: string;
  impact: string;
}

export interface DependanceAppExterne {
  name_application: string;
  description_impact: string;
}

// === PLANIFICATION / INFRASTRUCTURE ===

export interface VM {
  environnement: string;
  nom: string;
  role: string;
  os: string;
  cpu: number;
  ram: number;
  resilience: string;
}

export interface Conteneur {
  nom: string;
  image: string;
  ports: string;
  volumes: string;
  ressources_cpu: string;
  ressources_ram: string;
}

export interface BaseDeDonnees {
  moteur: string;
  version: string;
  taille: string;
  backup: string;
  ha: string;
}

export interface Stockage {
  nb_buckets: string;
  taille_totale: string;
  politique_retention: string;
}

export interface PartageNFS {
  machine_cliente: string;
  module_applicatif: string;
  droits: string;
}

// === MODÈLE PRINCIPAL DU FORMULAIRE ===

export interface DatFormValues {
  // Informations générales
  titre_projet: string;
  chef_projet: string;
  contact_tech: string;
  date: string;
  description_doc: string;

  // Introduction
  objet_document: string;
  documents_reference: DocumentReference[];
  glossaire: GlossaireItem[];

  // Spécifications fonctionnelles
  acteurs: Acteur[];
  has_schema: boolean;
  schemas: SchemaFonctionnel[];
  schema_description: string;
  briques_fonctionnelles: BriqueFonctionnelle[];
  echanges_donnees: EchangeDonnees[];

  // Spécifications techniques
  composants_physiques: ComposantPhysique[];
  description_architecture: string;
  description_authentification: string;
  description_administrationtechnique: string;
  description_adminfonctionnelle: string;
  description_interapplicative: string;
  flux_reseau: FluxReseau[];
  choix_technologiques: ChoixTechnologique[];
  segmentation_dr: string;
  dns_nom: DnsNom[];

  // Cycle de vie
  deploiement: string;
  migration_reprise: string;
  supervision: string;
  sauvegarde_restauration: string;

  // Dépendances
  dependances_externes: DependanceExterne[];
  dependance_app_externes: DependanceAppExterne[];

  // Planification / Besoins
  vms: VM[];
  conteneurs: Conteneur[];
  bases_donnees: BaseDeDonnees[];
  stockage: Stockage[];
  partages_nfs: PartageNFS[];
  contraintes: string;
  niveau_services: string;
}

// === VALEURS PAR DÉFAUT ===

export const defaultDocumentReference: DocumentReference = {
  emetteur: '',
  document: '',
  version: '1.0'
};

export const defaultGlossaireItem: GlossaireItem = {
  abreviation: '',
  signification: ''
};

export const defaultActeur: Acteur = {
  acteur: '',
  role: '',
  droits: '',
  commentaires: ''
};

export const defaultBriqueFonctionnelle: BriqueFonctionnelle = {
  brique: '',
  description: ''
};

export const defaultEchangeDonnees: EchangeDonnees = {
  type_echange: 'API REST',
  brique_fonctionnelle: '',
  source: '',
  destination: '',
  type_donnees: '',
  volumetrie: '',
  volumetrie_journaliere: '',
  nb_fichiers_jour: '',
  frequence: '',
  hno: 'Non'
};

export const defaultChoixTechnologique: ChoixTechnologique = {
  tiers: '',
  produit: '',
  version: '',
  justification: ''
};

export const defaultDnsNom: DnsNom = {
  nom_dns: '',
  machine_associe: ''
};

export const defaultDependanceExterne: DependanceExterne = {
  dependance: '',
  impact: ''
};

export const defaultDependanceAppExterne: DependanceAppExterne = {
  name_application: '',
  description_impact: ''
};

export const defaultVM: VM = {
  environnement: 'Production',
  nom: '',
  role: '',
  os: 'Linux',
  cpu: 2,
  ram: 4,
  resilience: ''
};

export const defaultConteneur: Conteneur = {
  nom: '',
  image: '',
  ports: '',
  volumes: '',
  ressources_cpu: '',
  ressources_ram: ''
};

export const defaultBaseDeDonnees: BaseDeDonnees = {
  moteur: 'PostgreSQL',
  version: '',
  taille: '',
  backup: '',
  ha: ''
};

export const defaultStockage: Stockage = {
  nb_buckets: '',
  taille_totale: '',
  politique_retention: ''
};

export const defaultPartageNFS: PartageNFS = {
  machine_cliente: '',
  module_applicatif: '',
  droits: 'rw'
};

// === VALEURS PAR DÉFAUT DU FORMULAIRE COMPLET ===

export const defaultDatFormValues: DatFormValues = {
  // Informations générales
  titre_projet: '',
  chef_projet: '',
  contact_tech: '',
  date: new Date().toISOString().split('T')[0],
  description_doc: '',

  // Introduction
  objet_document: '',
  documents_reference: [],
  glossaire: [],

  // Spécifications fonctionnelles
  acteurs: [{ ...defaultActeur }],
  has_schema: false,
  schemas: [],
  schema_description: '',
  briques_fonctionnelles: [],
  echanges_donnees: [],

  // Spécifications techniques
  composants_physiques: [],
  description_architecture: '',
  description_authentification: '',
  description_administrationtechnique: '',
  description_adminfonctionnelle: '',
  description_interapplicative: '',
  flux_reseau: [],
  choix_technologiques: [],
  segmentation_dr: 'Non',
  dns_nom: [],

  // Cycle de vie
  deploiement: '',
  migration_reprise: '',
  supervision: '',
  sauvegarde_restauration: '',

  // Dépendances
  dependances_externes: [],
  dependance_app_externes: [],

  // Planification / Besoins
  vms: [{ ...defaultVM }],
  conteneurs: [],
  bases_donnees: [],
  stockage: [],
  partages_nfs: [],
  contraintes: '',
  niveau_services: ''
};
