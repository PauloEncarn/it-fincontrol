import shutil
import os
import re
from datetime import date, datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Date, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

# --- CONFIGURAÇÃO DO BANCO (SQLite Local) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./financeiro.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELOS (TABELAS) ---

class FilialDB(Base):
    __tablename__ = "filiais"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String)
    nome_fantasia = Column(String)
    lancamentos = relationship("LancamentoDB", back_populates="filial")

class FornecedorDB(Base):
    __tablename__ = "fornecedores"
    id = Column(Integer, primary_key=True, index=True)
    nome_empresa = Column(String)
    lista_cnpjs = Column(String) 
    lista_contratos = Column(String)
    lista_centro_custos = Column(String)
    
    # Novos campos padrão para facilitar o lançamento
    padrao_descricao_servico = Column(String, nullable=True)
    padrao_servico_protheus = Column(String, nullable=True)
    
    lancamentos = relationship("LancamentoDB", back_populates="fornecedor")

class LancamentoDB(Base):
    __tablename__ = "lancamentos"
    id = Column(Integer, primary_key=True, index=True)
    
    # Chaves
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"))
    filial_id = Column(Integer, ForeignKey("filiais.id"))
    
    # Identificação Selecionada
    cnpj_usado = Column(String)
    contrato_usado = Column(String)
    centro_custo_usado = Column(String)
    
    # Dados da Nota
    numero_nota = Column(String)
    serie = Column(String, default="U")
    valor = Column(Float)
    
    # Datas
    data_emissao = Column(Date)
    data_vencimento = Column(Date)
    data_recebimento = Column(Date, nullable=True)
    
    # Detalhes
    descricao_servico = Column(String, nullable=True)
    servico_protheus = Column(String, nullable=True)
    
    # Controle T.I.
    numero_medicao = Column(String, nullable=True)
    numero_pedido = Column(String, nullable=True)
    solicitacao_fluig = Column(String, nullable=True)
    observacao = Column(String, nullable=True)
    
    # Status e Arquivos
    status_pagamento = Column(String, default="Pendente Lançamento")
    arquivo_nota = Column(String, nullable=True)
    arquivo_boleto = Column(String, nullable=True)

    # Auditoria
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    fornecedor = relationship("FornecedorDB", back_populates="lancamentos")
    filial = relationship("FilialDB", back_populates="lancamentos")

# Cria as tabelas
Base.metadata.create_all(bind=engine)

# --- SCHEMAS (VALIDAÇÃO) ---

class LancamentoCreate(BaseModel):
    fornecedor_id: int
    filial_id: int
    cnpj_usado: str
    contrato_usado: str
    centro_custo_usado: str
    numero_nota: str
    serie: str = "U"
    valor: float
    data_emissao: date
    data_vencimento: date
    data_recebimento: Optional[date] = None
    descricao_servico: Optional[str] = None
    servico_protheus: Optional[str] = None
    numero_medicao: Optional[str] = None
    numero_pedido: Optional[str] = None
    solicitacao_fluig: Optional[str] = None
    observacao: Optional[str] = None
    status_pagamento: str = "Pendente Lançamento"
    arquivo_nota: Optional[str] = None
    arquivo_boleto: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class FilialResponse(BaseModel):
    id: int
    codigo: str
    nome_fantasia: str
    class Config:
        orm_mode = True

class LancamentoResponse(LancamentoCreate):
    id: int
    updated_at: Optional[datetime]
    class Config:
        orm_mode = True

class FornecedorResponse(BaseModel):
    id: int
    nome_empresa: str
    lista_cnpjs: str
    lista_contratos: str
    lista_centro_custos: str
    padrao_descricao_servico: Optional[str]
    padrao_servico_protheus: Optional[str]
    lancamentos: List[LancamentoResponse] = []
    class Config:
        orm_mode = True

# --- API ---

app = FastAPI()

# Configuração de Uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def sanitize_filename(name: str) -> str:
    # Remove caracteres inválidos para pastas
    return re.sub(r'[<>:"/\\|?*]', '_', str(name)).strip()

# --- ROTAS ---

@app.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    fornecedor: str = Form("Outros"),
    nota: str = Form("S_N"),
    vencimento: str = Form("S_D")
):
    safe_fornecedor = sanitize_filename(fornecedor)
    safe_nota = sanitize_filename(nota)
    safe_venc = sanitize_filename(vencimento)
    
    # Estrutura: uploads/FORNECEDOR/NOTA_VENCIMENTO/arquivo.ext
    folder_path = f"uploads/{safe_fornecedor}/{safe_nota}_{safe_venc}"
    os.makedirs(folder_path, exist_ok=True)
    
    file_location = f"{folder_path}/{file.filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    return {"path": file_location}

@app.get("/criar-dados-teste")
def criar_teste(db: Session = Depends(get_db)):
    if db.query(FilialDB).first():
        return {"msg": "Dados existem"}
    
    # Filiais
    db.add_all([
        FilialDB(codigo="01", nome_fantasia="MATRIZ"),
        FilialDB(codigo="02", nome_fantasia="FILIAL SP")
    ])
    
    # Fornecedores com dados padrão
    forn1 = FornecedorDB(
        nome_empresa="DELL COMPUTADORES", 
        lista_cnpjs="00.123.456/0001-00", 
        lista_contratos="CTR-DELL-2025", 
        lista_centro_custos="1.01 - TI INFRA",
        padrao_descricao_servico="LOCAÇÃO DE NOTEBOOKS",
        padrao_servico_protheus="001 - LOCAÇÃO HARDWARE"
    )
    
    forn2 = FornecedorDB(
        nome_empresa="G7 TECNOLOGIA", 
        lista_cnpjs="99.888.777/0001-11", 
        lista_contratos="CTR-G7-DBA", 
        lista_centro_custos="1.05 - SISTEMAS",
        padrao_descricao_servico="DBA ORACLE E SUPORTE SIMPLIVITY",
        padrao_servico_protheus="005 - SUPORTE BANCO DE DADOS"
    )
    
    db.add(forn1)
    db.add(forn2)
    db.commit()
    return {"msg": "Dados criados!"}

@app.get("/filiais/", response_model=List[FilialResponse])
def ler_filiais(db: Session = Depends(get_db)):
    return db.query(FilialDB).all()

@app.get("/fornecedores/", response_model=List[FornecedorResponse])
def ler_fornecedores(db: Session = Depends(get_db)):
    return db.query(FornecedorDB).all()

@app.get("/dados-agrupados/", response_model=List[FornecedorResponse])
def dashboard(filial_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(FornecedorDB)
    if filial_id:
        query = query.join(LancamentoDB).filter(LancamentoDB.filial_id == filial_id)
    return query.all()

@app.post("/lancamentos/")
def criar(item: LancamentoCreate, db: Session = Depends(get_db)):
    if not item.serie:
        item.serie = "U"
        
    db_item = LancamentoDB(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put("/lancamentos/{id}")
def editar(id: int, item: LancamentoCreate, db: Session = Depends(get_db)):
    db_item = db.query(LancamentoDB).filter(LancamentoDB.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Não encontrado")
    
    for key, value in item.dict().items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@app.patch("/lancamentos/{id}/status")
def status(id: int, st: StatusUpdate, db: Session = Depends(get_db)):
    db_item = db.query(LancamentoDB).filter(LancamentoDB.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Não encontrado")
    
    db_item.status_pagamento = st.status
    db.commit()
    db.refresh(db_item)
    return db_item