import re
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from docxtpl import DocxTemplate, RichText
from datetime import datetime
from html import unescape

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TEMPLATE_DIR = BASE_DIR / "app" / "templates"

# Fields that contain HTML from the rich text editor
HTML_FIELDS = {
    'objet_document', 'schema_description', 'description_architecture',
    'description_authentification', 'description_administrationtechnique',
    'description_adminfonctionnelle', 'description_interapplicative',
    'deploiement', 'migration_reprise', 'supervision', 'sauvegarde_restauration',
    'contraintes', 'niveau_services', 'description', 'commentaires'
}


class _RTBuilder(HTMLParser):
    """Converts Tiptap HTML to a docxtpl RichText object, preserving formatting."""

    def __init__(self):
        super().__init__()
        self._rt = RichText()
        self._bold = 0
        self._italic = 0
        self._underline = 0
        self._strike = 0
        self._color_stack: list = []
        self._bg_stack: list = []
        self._in_li = False

    def _css_val(self, style: str, prop: str):
        for part in style.split(';'):
            part = part.strip()
            if part.lower().startswith(prop + ':'):
                val = part[len(prop) + 1:].strip()
                return val.lstrip('#') if val.startswith('#') else None
        return None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        style = attrs.get('style', '')

        if tag in ('strong', 'b'):
            self._bold += 1
        elif tag in ('em', 'i'):
            self._italic += 1
        elif tag == 'u':
            self._underline += 1
        elif tag in ('s', 'del'):
            self._strike += 1
        elif tag in ('h1', 'h2', 'h3'):
            self._bold += 1
        elif tag == 'span':
            self._color_stack.append(self._css_val(style, 'color'))
            self._bg_stack.append(self._css_val(style, 'background-color'))
        elif tag == 'mark':
            raw = self._css_val(style, 'background-color') or 'FFEB3B'
            self._bg_stack.append(raw)
        elif tag == 'li':
            self._in_li = True
            self._rt.add('• ')
        elif tag == 'br':
            self._rt.add('\n')

    def handle_endtag(self, tag):
        if tag in ('strong', 'b'):
            self._bold = max(0, self._bold - 1)
        elif tag in ('em', 'i'):
            self._italic = max(0, self._italic - 1)
        elif tag == 'u':
            self._underline = max(0, self._underline - 1)
        elif tag in ('s', 'del'):
            self._strike = max(0, self._strike - 1)
        elif tag in ('h1', 'h2', 'h3'):
            self._bold = max(0, self._bold - 1)
            self._rt.add('\n')
        elif tag == 'span':
            if self._color_stack:
                self._color_stack.pop()
            if self._bg_stack:
                self._bg_stack.pop()
        elif tag == 'mark':
            if self._bg_stack:
                self._bg_stack.pop()
        elif tag == 'p':
            self._rt.add('\n')
        elif tag == 'li':
            self._in_li = False
            self._rt.add('\n')
        elif tag == 'blockquote':
            self._rt.add('\n')

    def handle_data(self, data):
        if not data:
            return
        if not data.strip() and not self._in_li:
            return

        kwargs = {}
        if self._bold > 0:
            kwargs['bold'] = True
        if self._italic > 0:
            kwargs['italic'] = True
        if self._underline > 0:
            kwargs['underline'] = True
        if self._strike > 0:
            kwargs['strike'] = True

        color = next((c for c in reversed(self._color_stack) if c), None)
        if color:
            kwargs['color'] = color

        bg = next((b for b in reversed(self._bg_stack) if b), None)
        if bg:
            kwargs['background_color'] = bg

        self._rt.add(data, **kwargs)

    def result(self) -> RichText:
        return self._rt


def html_to_richtext(html: str) -> RichText:
    """Convert HTML from Tiptap editor to a docxtpl RichText object."""
    if not html:
        return RichText('')
    html = unescape(html)
    builder = _RTBuilder()
    builder.feed(html)
    return builder.result()


def strip_html(html: str) -> str:
    """Fallback: strip HTML to plain text (used when template uses {{field}} syntax)."""
    if not html:
        return ''
    text = re.sub(r'<br\s*/?>', '\n', html)
    text = re.sub(r'</p>', '\n', text)
    text = re.sub(r'</div>', '\n', text)
    text = re.sub(r'</li>', '\n', text)
    text = re.sub(r'<li[^>]*>', '• ', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = unescape(text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()


def clean_data_for_word(data: dict) -> dict:
    """Convert HTML fields to RichText objects for docxtpl rendering."""
    cleaned = {}
    for key, value in data.items():
        if isinstance(value, str):
            cleaned[key] = html_to_richtext(value) if key in HTML_FIELDS else value
        elif isinstance(value, list):
            cleaned[key] = [
                clean_data_for_word(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, dict):
            cleaned[key] = clean_data_for_word(value)
        else:
            cleaned[key] = value
    return cleaned


class DocumentService:
    def generate_dat(self, data: dict) -> str:
        template_path = TEMPLATE_DIR / "dat_template.docx"

        if not template_path.exists():
            raise FileNotFoundError(f"Template introuvable : {template_path}")

        doc = DocxTemplate(template_path)
        cleaned_data = clean_data_for_word(data)
        doc.render(cleaned_data)

        safe_title = "".join(
            c for c in data.get('titre_projet', 'document') if c.isalnum() or c in (' ', '-', '_')
        ).strip() or "document"

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"DAT_{safe_title}_{timestamp}.docx"
        output_path = Path(tempfile.gettempdir()) / filename
        doc.save(str(output_path))

        return str(output_path)
