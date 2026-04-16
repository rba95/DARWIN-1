from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from app.schemas.dat import DatRequest
from app.services.doc_generator import DocumentService
import os
import subprocess
import tempfile
from typing import Literal

router = APIRouter()

# On instancie le service qui va manipuler le document Word
document_service = DocumentService()

@router.post("/generate")
async def generate_dat(
    data: DatRequest,
    format: Literal["docx", "pdf", "odt"] = Query(default="docx", description="Format de sortie")
):
    try:
        # 1. On génère d'abord le fichier DOCX
        docx_path = document_service.generate_dat(data.model_dump()) 
        
        # 2. Vérification de sécurité
        if not docx_path or not os.path.exists(docx_path):
            print(f"Erreur : Le fichier {docx_path} n'a pas été trouvé sur le serveur.")
            raise HTTPException(status_code=500, detail="Erreur lors de la création du fichier Word.")

        # 3. Si format = docx, retourner directement
        if format == "docx":
            return FileResponse(
                path=docx_path,
                filename=f"DAT_{data.titre_projet}.docx",
                media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
        
        # 4. Conversion vers PDF ou ODT avec LibreOffice
        output_dir = tempfile.gettempdir()
        base_name = os.path.splitext(os.path.basename(docx_path))[0]
        
        if format == "pdf":
            # Conversion DOCX -> PDF
            output_format = "pdf"
            media_type = "application/pdf"
            extension = "pdf"
        else:  # odt
            # Conversion DOCX -> ODT
            output_format = "odt"
            media_type = "application/vnd.oasis.opendocument.text"
            extension = "odt"
        
        try:
            # Utiliser LibreOffice pour la conversion
            result = subprocess.run([
                "libreoffice",
                "--headless",
                "--convert-to", output_format,
                "--outdir", output_dir,
                docx_path
            ], capture_output=True, text=True, timeout=60)
            
            if result.returncode != 0:
                print(f"LibreOffice error: {result.stderr}")
                # Fallback: si LibreOffice échoue, retourner le DOCX
                if format == "pdf":
                    raise HTTPException(
                        status_code=500, 
                        detail="Conversion PDF non disponible. LibreOffice requis."
                    )
                # Pour ODT, essayer avec python-pptx alternative
                raise HTTPException(
                    status_code=500, 
                    detail="Conversion ODT non disponible. LibreOffice requis."
                )
            
            output_path = os.path.join(output_dir, f"{base_name}.{extension}")
            
            if not os.path.exists(output_path):
                raise HTTPException(status_code=500, detail=f"Fichier {extension.upper()} non généré.")
            
            return FileResponse(
                path=output_path,
                filename=f"DAT_{data.titre_projet}.{extension}",
                media_type=media_type
            )
            
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="Timeout lors de la conversion.")
        except FileNotFoundError:
            # LibreOffice n'est pas installé
            if format != "docx":
                raise HTTPException(
                    status_code=500, 
                    detail=f"Conversion {format.upper()} non disponible. LibreOffice n'est pas installé."
                )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERREUR GÉNÉRATION : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

