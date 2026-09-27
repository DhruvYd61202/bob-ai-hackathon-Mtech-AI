import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.analysis import router as analysis_router
from app.api.bob import router as bob_router
from app.api.cases import router as cases_router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ForensicAI")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DeepFake ForensicAI system...")
    # Ensure storage paths exist
    _ = settings.upload_path
    _ = settings.case_path
    _ = settings.report_path
    _ = settings.model_path
    logger.info(f"Target compute device: {settings.compute_device}")
    try:
        from app.models.model_manager import get_model_manager
        model_manager = get_model_manager()
        model_manager.load_all()
        logger.info("All pre-trained AI forensic models loaded and ready.")
    except Exception as e:
        logger.warning(f"Deferred model loading: {e}")
    yield
    logger.info("Shutting down DeepFake ForensicAI.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multimodal Digital-Forensics System for Detecting and Explaining Manipulated Media",
    lifespan=lifespan
)

# Configure CORS
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during {request.method} {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal processing error occurred during forensic analysis."}
    )

# Static media mount for previewing uploads
app.mount("/media", StaticFiles(directory=str(settings.upload_path)), name="media")

@app.get("/explanations/{case_id}/{filename}")
async def get_explanation_file(case_id: str, filename: str):
    from app.core.storage import get_case_explanations_dir, get_safe_path
    from fastapi.responses import FileResponse
    exp_dir = get_case_explanations_dir(case_id)
    target = get_safe_path(exp_dir, filename)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Explanation image not found")
    return FileResponse(str(target), media_type="image/jpeg")

@app.get("/frames/{case_id}/{filename}")
async def get_frame_file(case_id: str, filename: str):
    from app.core.storage import get_case_frames_dir, get_safe_path
    from fastapi.responses import FileResponse
    frames_dir = get_case_frames_dir(case_id)
    target = get_safe_path(frames_dir, filename)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Frame image not found")
    return FileResponse(str(target), media_type="image/jpeg")

# Include Routers
app.include_router(analysis_router)
app.include_router(cases_router)
app.include_router(bob_router)

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "device": settings.compute_device
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
