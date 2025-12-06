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
from sqlalchemy.orm import sessionmaker, Session, relationship, contains_eager

# ⚠️ SUBSTITUA 'SUA_SENHA_AQUI' PELA SENHA REAL DO SUPABASE
# O link abaixo já está no formato correto (postgresql://... porta 6543)
SQLALCHEMY_DATABASE_URL = "postgresql://postgres.xadqglbzkqqohyzefqdo:ierkiaHjqzgnjvqB@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

# Cria o motor de conexão (Engine)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cria a sessão
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
    
    padrao_descricao_servico = Column(String, nullable=True)
    padrao_servico_protheus = Column(String, nullable=True)
    
    lancamentos = relationship("LancamentoDB", back_populates="fornecedor")

class LancamentoDB(Base):
    __tablename__ = "lancamentos"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Chaves Estrangeiras
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"))
    filial_id = Column(Integer, ForeignKey("filiais.id"))
    
    # Identificação Escolhida
    cnpj_usado = Column(String)
    contrato_usado = Column(String)
    centro_custo_usado = Column(String)
    
    # Dados Financeiros
    numero_nota = Column(String)
    serie = Column(String, default="U")
    valor = Column(Float)
    
    # Datas
    data_envio = Column(Date, nullable=True)
    data_vencimento = Column(Date)
    
    # Detalhes
    descricao_servico = Column(String, nullable=True)
    servico_protheus = Column(String, nullable=True)
    
    # Controle
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

    # Relacionamentos
    fornecedor = relationship("FornecedorDB", back_populates="lancamentos")
    filial = relationship("FilialDB", back_populates="lancamentos")

# Cria as tabelas
Base.metadata.create_all(bind=engine)

# --- SCHEMAS (VALIDAÇÃO DE DADOS) ---

class LancamentoCreate(BaseModel):
    fornecedor_id: int
    filial_id: int
    cnpj_usado: str
    contrato_usado: str
    centro_custo_usado: str
    numero_nota: str
    serie: str = "U"
    valor: float
    data_envio: Optional[date] = None
    data_vencimento: date
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

# Configura pasta de uploads
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
    # Limpa caracteres especiais para evitar erro ao criar pasta
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
    
    # Cria pasta: uploads/NOME_FORNECEDOR/NOTA_VENCIMENTO
    folder_path = f"uploads/{safe_fornecedor}/{safe_nota}_{safe_venc}"
    os.makedirs(folder_path, exist_ok=True)
    
    file_location = f"{folder_path}/{file.filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    return {"path": file_location}

@app.get("/criar-dados-teste")
def criar_teste(db: Session = Depends(get_db)):
    if db.query(FilialDB).first():
        return {"msg": "Dados já existem"}
    
    return {"msg": "Banco limpo. Use o script de importação ou SQL."}

@app.get("/filiais/", response_model=List[FilialResponse])
def ler_filiais(db: Session = Depends(get_db)):
    return db.query(FilialDB).all()

@app.get("/fornecedores/", response_model=List[FornecedorResponse])
def ler_fornecedores(db: Session = Depends(get_db)):
    return db.query(FornecedorDB).all()

@app.get("/dados-agrupados/", response_model=List[FornecedorResponse])
def dashboard(filial_id: Optional[int] = None, db: Session = Depends(get_db)):
    # Faz o JOIN inicial para garantir que pegamos fornecedores que têm lançamentos
    query = db.query(FornecedorDB).join(LancamentoDB)
    
    if filial_id:
        # Filtra os lançamentos pela filial específica
        query = query.filter(LancamentoDB.filial_id == filial_id)
        
        # O contains_eager diz ao SQLAlchemy: 
        # "Use os dados que você já filtrou no JOIN acima para preencher a lista de lançamentos"
        # Isso evita que ele traga notas de outras filiais para o mesmo fornecedor.
        query = query.options(contains_eager(FornecedorDB.lancamentos))
    
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