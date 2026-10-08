"""Domain errors and the handler that renders them as {detail, code} JSON."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    """An error with a machine-readable code and an HTTP status."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "APP_ERROR"

    def __init__(self, detail: str, *, code: str | None = None, status_code: int | None = None):
        super().__init__(detail)
        self.detail = detail
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"


class ConflictError(AppError):
    """The request is well-formed but the app is not in a state that allows it."""

    status_code = status.HTTP_409_CONFLICT
    code = "CONFLICT"


class PaymentRequiredError(AppError):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    code = "INSUFFICIENT_GEMS"


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )
