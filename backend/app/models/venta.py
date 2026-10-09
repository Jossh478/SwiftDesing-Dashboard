from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True)
    cliente = Column(String, nullable=False)
    monto_total = Column(Float, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)
    # JSONB es perfecto para guardar detalles dinámicos como la ubicación de envío o los items del carrito
    ubicacion_envio = Column(JSONB, nullable=True)