"""
Schéma Pydantic complet pour le DAT (Dossier d'Architecture Technique)
Basé sur le template Word officiel avec toutes les sections
"""
from pydantic import BaseModel, Field
from typing import List, Optional


# === INTRODUCTION ===

class DocumentReference(BaseModel):
    """Document de référence"""
    emetteur: str = Field(default="", description="Émetteur du document")
    document: str = Field(default="", description="Nom du document")
    version: str = Field(default="1.0", description="Version du document")


class GlossaireItem(BaseModel):
    """Entrée du glossaire"""
    abreviation: str = Field(default="", description="Abréviation")
    signification: str = Field(default="", description="Signification")


# === SPÉCIFICATIONS FONCTIONNELLES ===

class Acteur(BaseModel):
    """Acteur du système"""
    acteur: str = Field(default="", description="Nom de l'acteur ou équipe")
    role: str = Field(default="", description="Rôle de l'acteur")
    droits: str = Field(default="", description="Droits associés")
    commentaires: str = Field(default="", description="Commentaires")


class SchemaFonctionnel(BaseModel):
    """Schéma fonctionnel avec image"""
    titre: str = Field(default="", description="Titre du schéma")
    description: str = Field(default="", description="Description du schéma")
    image: str = Field(default="", description="Chemin de l'image (optionnel)")


class BriqueFonctionnelle(BaseModel):
    """Brique fonctionnelle de l'application"""
    brique: str = Field(default="", description="Nom de la brique")
    description: str = Field(default="", description="Description / Applicatif")


class EchangeDonnees(BaseModel):
    """Échange de données et volumétrie"""
    type_echange: str = Field(default="", description="Type d'échange (API, Fichier, etc.)")
    brique_fonctionnelle: str = Field(default="", description="Brique fonctionnelle concernée")
    source: str = Field(default="", description="Source des données")
    destination: str = Field(default="", description="Destination des données")
    type_donnees: str = Field(default="", description="Types de données échangées")
    volumetrie: str = Field(default="", description="Volumétrie moyenne")
    volumetrie_journaliere: str = Field(default="", description="Volumétrie journalière")
    nb_fichiers_jour: str = Field(default="", description="Nombre de fichiers par jour")
    frequence: str = Field(default="", description="Fréquence de l'échange")
    hno: str = Field(default="Non", description="Échange HNO uniquement?")


# === SPÉCIFICATIONS TECHNIQUES ===

class ComposantPhysique(BaseModel):
    """Composant physique de l'infrastructure"""
    type_machine: str = Field(default="", description="Type de machine")
    environnement: str = Field(default="", description="Environnement")
    cluster: str = Field(default="", description="Cluster de virtualisation")


class FluxReseau(BaseModel):
    """Flux réseau entre systèmes"""
    type_echange: str = Field(default="", description="Type d'échange")
    brique_fonctionnelle: str = Field(default="", description="Brique fonctionnelle")
    source: str = Field(default="", description="Source")
    destination: str = Field(default="", description="Destination")
    description: str = Field(default="", description="Description")
    type_flux: str = Field(default="", description="Type de flux (TCP, UDP, etc.)")


class ChoixTechnologique(BaseModel):
    """Choix technologique"""
    tiers: str = Field(default="", description="Tiers ou brique métier")
    produit: str = Field(default="", description="Produit/Composant")
    version: str = Field(default="", description="Version")
    justification: str = Field(default="", description="Justification si hors catalogue recommandé")


class DnsNom(BaseModel):
    """Nom DNS"""
    nom_dns: str = Field(default="", description="Nom du DNS")
    machine_associe: str = Field(default="", description="Machine associée")


# === DÉPENDANCES ===

class DependanceExterne(BaseModel):
    """Dépendance externe sur mon application"""
    dependance: str = Field(default="", description="Nom de la dépendance")
    impact: str = Field(default="", description="Impact sur l'application")


class DependanceAppExterne(BaseModel):
    """Dépendance de mon application sur des services externes"""
    name_application: str = Field(default="", description="Mon application")
    description_impact: str = Field(default="", description="Impact sur autres applications")


# === PLANIFICATION / INFRASTRUCTURE ===

class VM(BaseModel):
    """Machine virtuelle"""
    environnement: str = Field(default="Production", description="Environnement (Dev, Recette, Prod)")
    nom: str = Field(default="", description="Nom de la VM")
    role: str = Field(default="", description="Rôle de la VM")
    os: str = Field(default="Linux", description="Système d'exploitation")
    cpu: int = Field(default=2, description="Nombre de CPU")
    ram: int = Field(default=4, description="RAM en Go")
    resilience: str = Field(default="", description="Mode de résilience")


class Conteneur(BaseModel):
    """Conteneur Docker/Kubernetes"""
    nom: str = Field(default="", description="Nom du conteneur")
    image: str = Field(default="", description="Image Docker")
    ports: str = Field(default="", description="Ports exposés")
    volumes: str = Field(default="", description="Volumes montés")
    ressources_cpu: str = Field(default="", description="Ressources CPU")
    ressources_ram: str = Field(default="", description="Ressources RAM")


class BaseDeDonnees(BaseModel):
    """Configuration base de données"""
    moteur: str = Field(default="PostgreSQL", description="Moteur BDD")
    version: str = Field(default="", description="Version")
    taille: str = Field(default="", description="Taille estimée")
    backup: str = Field(default="", description="Stratégie de backup")
    ha: str = Field(default="", description="Haute disponibilité")


class Stockage(BaseModel):
    """Stockage objet (S3, etc.)"""
    nb_buckets: str = Field(default="", description="Nombre de buckets")
    taille_totale: str = Field(default="", description="Taille totale estimée")
    politique_retention: str = Field(default="", description="Politique de rétention")


class PartageNFS(BaseModel):
    """Partage NFS"""
    machine_cliente: str = Field(default="", description="Machine cliente")
    module_applicatif: str = Field(default="", description="Module applicatif")
    droits: str = Field(default="rw", description="Droits (r, w, rw)")


# === MODÈLE PRINCIPAL ===

class DatRequest(BaseModel):
    """
    Modèle principal pour la génération du DAT
    Toutes les sections du document officiel sont représentées
    """
    
    # === INFORMATIONS GÉNÉRALES ===
    titre_projet: str = Field(default="", description="Titre du projet")
    chef_projet: str = Field(default="", description="Chef de projet")
    contact_tech: str = Field(default="", description="Contact technique")
    date: str = Field(default="", description="Date du document")
    description_doc: str = Field(default="", description="Description du document")
    
    # === INTRODUCTION ===
    objet_document: str = Field(default="", description="Objet du document")
    documents_reference: List[DocumentReference] = Field(default_factory=list)
    glossaire: List[GlossaireItem] = Field(default_factory=list)
    
    # === SPÉCIFICATIONS FONCTIONNELLES ===
    acteurs: List[Acteur] = Field(default_factory=list)
    has_schema: bool = Field(default=False, description="Présence de schéma fonctionnel")
    schemas: List[SchemaFonctionnel] = Field(default_factory=list)
    schema_description: str = Field(default="", description="Description du schéma fonctionnel")
    briques_fonctionnelles: List[BriqueFonctionnelle] = Field(default_factory=list)
    echanges_donnees: List[EchangeDonnees] = Field(default_factory=list)
    
    # === SPÉCIFICATIONS TECHNIQUES ===
    composants_physiques: List[ComposantPhysique] = Field(default_factory=list)
    description_architecture: str = Field(default="", description="Description de l'architecture")
    description_authentification: str = Field(default="", description="Description de l'authentification")
    description_administrationtechnique: str = Field(default="", description="Administration technique")
    description_adminfonctionnelle: str = Field(default="", description="Administration fonctionnelle")
    description_interapplicative: str = Field(default="", description="Administration inter-applicative")
    flux_reseau: List[FluxReseau] = Field(default_factory=list)
    choix_technologiques: List[ChoixTechnologique] = Field(default_factory=list)
    segmentation_dr: str = Field(default="Non", description="Données DR ou sensibles")
    dns_nom: List[DnsNom] = Field(default_factory=list)
    
    # === CYCLE DE VIE ===
    deploiement: str = Field(default="", description="Stratégie de déploiement")
    migration_reprise: str = Field(default="", description="Migration/Reprise de données")
    supervision: str = Field(default="", description="Supervision et observabilité")
    sauvegarde_restauration: str = Field(default="", description="Sauvegardes et restauration")
    
    # === DÉPENDANCES ===
    dependances_externes: List[DependanceExterne] = Field(default_factory=list)
    dependance_app_externes: List[DependanceAppExterne] = Field(default_factory=list)
    
    # === PLANIFICATION / BESOINS ===
    vms: List[VM] = Field(default_factory=list)
    conteneurs: List[Conteneur] = Field(default_factory=list)
    bases_donnees: List[BaseDeDonnees] = Field(default_factory=list)
    stockage: List[Stockage] = Field(default_factory=list)
    partages_nfs: List[PartageNFS] = Field(default_factory=list)
    contraintes: str = Field(default="", description="Contraintes spécifiques")
    niveau_services: str = Field(default="", description="Niveau de service attendu")

    class Config:
        json_schema_extra = {
            "example": {
                "titre_projet": "Mon Projet",
                "chef_projet": "Jean Dupont",
                "contact_tech": "tech@example.com",
                "date": "2026-02-18",
                "objet_document": "Ce document décrit l'architecture technique...",
                "acteurs": [
                    {"acteur": "Équipe Dev", "role": "Développement", "droits": "Admin", "commentaires": ""}
                ],
                "vms": [
                    {"environnement": "Production", "nom": "SRV-APP-01", "role": "Serveur applicatif", "os": "Linux", "cpu": 4, "ram": 8, "resilience": "HA"}
                ]
            }
        }
