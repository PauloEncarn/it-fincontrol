import shutil
import os
import re
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Date, Float, ForeignKey, DateTime, extract
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship, contains_eager, joinedload
from passlib.context import CryptContext
from jose import JWTError, jwt

# --- CONFIGURAÇÃO DO BANCO DE DADOS (SEU LINK CORRETO) ---
SQLALCHEMY_DATABASE_URL = "postgresql://postgres.xadqglbzkqqohyzefqdo:ierkiaHjqzgnjvqB@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SEGURANÇA ---
SECRET_KEY = "SEGREDO_SUPER_SECRETO_DA_CICOPAL"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- MODELOS (TABELAS) ---

class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    nome_completo = Column(String)
    cpf = Column(String)
    setor = Column(String)
    cargo = Column(String)
    created_at = Column(DateTime, default=datetime.now)

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
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"))
    filial_id = Column(Integer, ForeignKey("filiais.id"))
    cnpj_usado = Column(String)
    contrato_usado = Column(String)
    centro_custo_usado = Column(String)
    numero_nota = Column(String)
    serie = Column(String, default="U")
    valor = Column(Float)
    data_envio = Column(Date, nullable=True)
    data_vencimento = Column(Date)
    descricao_servico = Column(String, nullable=True)
    servico_protheus = Column(String, nullable=True)
    numero_medicao = Column(String, nullable=True)
    numero_pedido = Column(String, nullable=True)
    solicitacao_fluig = Column(String, nullable=True)
    observacao = Column(String, nullable=True)
    status_pagamento = Column(String, default="Pendente Lançamento")
    arquivo_nota = Column(String, nullable=True)
    arquivo_boleto = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    fornecedor = relationship("FornecedorDB", back_populates="lancamentos")
    filial = relationship("FilialDB", back_populates="lancamentos")

Base.metadata.create_all(bind=engine)

# --- SCHEMAS (FORMATADOS CORRETAMENTE) ---

class Token(BaseModel):
    access_token: str
    token_type: str

class UsuarioCreate(BaseModel):
    username: str
    password: str
    nome_completo: str
    cpf: str
    setor: str
    cargo: str

class UsuarioResponse(BaseModel):
    id: int
    username: str
    nome_completo: Optional[str] = None
    setor: Optional[str] = None
    cargo: Optional[str] = None
    class Config:
        orm_mode = True

class FilialCreate(BaseModel):
    codigo: str
    nome_fantasia: str

class FornecedorCreate(BaseModel):
    nome_empresa: str
    lista_cnpjs: str
    lista_contratos: str
    lista_centro_custos: str
    padrao_descricao_servico: Optional[str] = None
    padrao_servico_protheus: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

# Schema expandido para evitar erro
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

class FilialSimple(BaseModel):
    id: int
    codigo: str
    nome_fantasia: str
    class Config:
        orm_mode = True

class LancamentoResponse(LancamentoCreate):
    id: int
    updated_at: Optional[datetime]
    filial: Optional[FilialSimple] = None
    class Config:
        orm_mode = True

class FilialResponse(BaseModel):
    id: int
    codigo: str
    nome_fantasia: str
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
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def sanitize_filename(name: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', '_', str(name)).strip()

def verify_password(p, h):
    return pwd_context.verify(p, h)

def get_password_hash(p):
    return pwd_context.hash(p)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)
    user = db.query(UsuarioDB).filter(UsuarioDB.username == username).first()
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)
    return user

# --- ROTAS ---

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UsuarioDB).filter(UsuarioDB.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)
    return {"access_token": jwt.encode({"sub": user.username}, SECRET_KEY, algorithm=ALGORITHM), "token_type": "bearer"}

@app.post("/usuarios/", response_model=UsuarioResponse)
def create_user(user: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(UsuarioDB).filter(UsuarioDB.username == user.username).first():
        raise HTTPException(400, "Username existe")
    db.add(UsuarioDB(username=user.username, password_hash=get_password_hash(user.password), nome_completo=user.nome_completo, cpf=user.cpf, setor=user.setor, cargo=user.cargo))
    db.commit()
    return db.query(UsuarioDB).filter(UsuarioDB.username == user.username).first()

@app.get("/usuarios/", response_model=List[UsuarioResponse])
def read_users(db: Session = Depends(get_db), current_user: UsuarioDB = Depends(get_current_user)):
    return db.query(UsuarioDB).all()

@app.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    fornecedor: str = Form("Outros"),
    nota: str = Form("S_N"),
    vencimento: str = Form("S_D")
):
    try:
        safe_forn = sanitize_filename(fornecedor)
        safe_nt = sanitize_filename(nota)
        safe_venc = sanitize_filename(vencimento)
        folder = f"uploads/{safe_forn}/{safe_nt}_{safe_venc}"
        os.makedirs(folder, exist_ok=True)
        loc = f"{folder}/{file.filename}"
        content = await file.read()
        with open(loc, "wb+") as f:
            f.write(content)
        return {"path": loc}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/filiais/", response_model=List[FilialResponse])
def ler_filiais(db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    return db.query(FilialDB).all()

@app.post("/filiais/", response_model=FilialResponse)
def criar_filial(item: FilialCreate, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    db_item = FilialDB(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put("/filiais/{id}", response_model=FilialResponse)
def editar_filial(id: int, item: FilialCreate, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    db_item = db.query(FilialDB).filter(FilialDB.id == id).first()
    if not db_item:
        raise HTTPException(404)
    for k,v in item.dict().items():
        setattr(db_item, k, v)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/filiais/{id}")
def deletar_filial(id: int, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    db.query(FilialDB).filter(FilialDB.id == id).delete()
    db.commit()
    return {"ok": True}

@app.get("/fornecedores/", response_model=List[FornecedorResponse])
def ler_fornecedores(db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    return db.query(FornecedorDB).all()

@app.post("/fornecedores/", response_model=FornecedorResponse)
def criar_fornecedor(item: FornecedorCreate, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    db_item = FornecedorDB(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put("/fornecedores/{id}", response_model=FornecedorResponse)
def editar_fornecedor(id: int, item: FornecedorCreate, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    db_item = db.query(FornecedorDB).filter(FornecedorDB.id == id).first()
    if not db_item:
        raise HTTPException(404)
    for k,v in item.dict().items():
        setattr(db_item, k, v)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/fornecedores/{id}")
def deletar_fornecedor(id: int, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    db.query(FornecedorDB).filter(FornecedorDB.id == id).delete()
    db.commit()
    return {"ok": True}

# --- DASHBOARD COM FILTROS DE DATA ---
@app.get("/dados-agrupados/", response_model=List[FornecedorResponse])
def dashboard(
    filial_id: Optional[int] = None, 
    mes: Optional[int] = None, 
    ano: Optional[int] = None, 
    db: Session = Depends(get_db), 
    user: UsuarioDB = Depends(get_current_user)
):
    query = db.query(FornecedorDB).join(LancamentoDB)
    
    if filial_id:
        query = query.filter(LancamentoDB.filial_id == filial_id)
    
    if mes and ano:
        query = query.filter(extract('month', LancamentoDB.data_vencimento) == mes)
        query = query.filter(extract('year', LancamentoDB.data_vencimento) == ano)
    
    query = query.options(contains_eager(FornecedorDB.lancamentos).joinedload(LancamentoDB.filial))
    return query.all()

@app.post("/lancamentos/")
def criar(item: LancamentoCreate, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    if not item.serie:
        item.serie = "U"
    db_item = LancamentoDB(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put("/lancamentos/{id}")
def editar(id: int, item: LancamentoCreate, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    db_item = db.query(LancamentoDB).filter(LancamentoDB.id == id).first()
    if not db_item:
        raise HTTPException(404)
    for k, v in item.dict().items():
        setattr(db_item, k, v)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.patch("/lancamentos/{id}/status")
def atualizar_status(id: int, st: StatusUpdate, db: Session = Depends(get_db), user: UsuarioDB = Depends(get_current_user)):
    db_item = db.query(LancamentoDB).filter(LancamentoDB.id == id).first()
    if not db_item:
        raise HTTPException(404)
    db_item.status_pagamento = st.status
    db.commit()
    db.refresh(db_item)
    return db_item