import re
import tempfile
from pathlib import Path
from docxtpl import DocxTemplate
from datetime import datetime
from html import unescape

# Chemin vers les templates
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
TEMPLATE_DIR = BASE_DIR / "app" / "templates"


def strip_html(html_content: str) -> str:
    """
    Convertit le HTML de l'éditeur riche en texte simple pour Word.
    Gère les listes, paragraphes, etc.
    """
    if not html_content:
        return ""
    
    text = html_content
    
    # Convertir les sauts de ligne HTML
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'</p>', '\n', text)
    text = re.sub(r'</div>', '\n', text)
    text = re.sub(r'</li>', '\n', text)
    
    # Convertir les listes à puces
    text = re.sub(r'<li[^>]*>', '• ', text)
    
    # Supprimer toutes les autres balises HTML
    text = re.sub(r'<[^>]+>', '', text)
    
    # Décoder les entités HTML
    text = unescape(text)
    
    # Nettoyer les espaces multiples et lignes vides multiples
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = text.strip()
    
    return text


def clean_data_for_word(data: dict) -> dict:
    """
    Nettoie récursivement toutes les chaînes HTML dans le dictionnaire.
    """
    cleaned = {}
    
    # Champs qui peuvent contenir du HTML (de l'éditeur riche)
    html_fields = {
        'objet_document', 'schema_description', 'description_architecture',
        'description_authentification', 'description_administrationtechnique',
        'description_adminfonctionnelle', 'description_interapplicative',
        'deploiement', 'migration_reprise', 'supervision', 'sauvegarde_restauration',
        'contraintes', 'niveau_services', 'description', 'commentaires'
    }
    
    for key, value in data.items():
        if isinstance(value, str):
            if key in html_fields:
                cleaned[key] = strip_html(value)
            else:
                cleaned[key] = value
        elif isinstance(value, list):
            cleaned[key] = []
            for item in value:
                if isinstance(item, dict):
                    cleaned[key].append(clean_data_for_word(item))
                else:
                    cleaned[key].append(item)
        elif isinstance(value, dict):
            cleaned[key] = clean_data_for_word(value)
        else:
            cleaned[key] = value
    
    return cleaned


class DocumentService:
    def generate_dat(self, data: dict) -> str:
        """
        Génère un DAT à partir d'un dictionnaire de données.
        Le fichier est créé dans un dossier temporaire (nettoyé automatiquement par l'OS).
        Aucune donnée n'est persistée sur le serveur.
        
        Args:
            data (dict): Les données validées par Pydantic (.model_dump())
            
        Returns:
            str: Le chemin absolu du fichier temporaire généré
        """
        template_path = TEMPLATE_DIR / "dat_template.docx"
        
        # 1. Vérification de l'existence du template
        if not template_path.exists():
            raise FileNotFoundError(f"Le template est introuvable : {template_path}")

        # 2. Chargement du template
        doc = DocxTemplate(template_path)

        # 3. Nettoyer les données HTML avant le rendu
        cleaned_data = clean_data_for_word(data)

        # 4. Rendu (Injection des variables Jinja2)
        doc.render(cleaned_data)

        # 5. Construction du nom de fichier unique
        safe_title = "".join([c for c in data.get('titre_projet', 'document') if c.isalnum() or c in (' ', '-', '_')]).strip()
        if not safe_title:
            safe_title = "document"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"DAT_{safe_title}_{timestamp}.docx"

        # 6. Sauvegarde dans un fichier temporaire (nettoyé par l'OS)
        tmp_dir = tempfile.gettempdir()
        output_path = Path(tmp_dir) / filename
        doc.save(str(output_path))

        return str(output_path)
