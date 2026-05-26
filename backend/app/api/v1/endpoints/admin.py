import os
import shutil
from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from fastapi.responses import FileResponse
from app.services.doc_generator import TEMPLATE_DIR

router = APIRouter()

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "darwin-admin")


def _verify(authorization: str | None):
    if not authorization or authorization != f"Bearer {ADMIN_PASSWORD}":
        raise HTTPException(status_code=401, detail="Non autorisé — mot de passe incorrect")


@router.get("/admin/status")
async def admin_status(authorization: str | None = Header(None)):
    _verify(authorization)
    template_path = TEMPLATE_DIR / "dat_template.docx"
    size_kb = round(template_path.stat().st_size / 1024, 1) if template_path.exists() else 0
    return {
        "template_exists": template_path.exists(),
        "template_size_kb": size_kb,
        "template_name": "dat_template.docx",
    }


@router.post("/admin/upload-template")
async def upload_template(
    file: UploadFile = File(...),
    authorization: str | None = Header(None),
):
    _verify(authorization)

    if not (file.filename or "").endswith(".docx"):
        raise HTTPException(status_code=400, detail="Seul le format .docx est accepté")

    template_path = TEMPLATE_DIR / "dat_template.docx"

    # Backup current template before overwriting
    if template_path.exists():
        shutil.copy(template_path, TEMPLATE_DIR / "dat_template.backup.docx")

    content = await file.read()
    TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)
    template_path.write_bytes(content)

    return {"message": "Template mis à jour avec succès", "filename": file.filename}


@router.get("/admin/download-template")
async def download_template(authorization: str | None = Header(None)):
    _verify(authorization)
    template_path = TEMPLATE_DIR / "dat_template.docx"
    if not template_path.exists():
        raise HTTPException(status_code=404, detail="Template introuvable")
    return FileResponse(
        path=str(template_path),
        filename="dat_template.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
