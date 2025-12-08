from main import SessionLocal, UsuarioDB, get_password_hash

def resetar_admin():
    db = SessionLocal()
    
    print("🔄 Verificando usuário admin...")
    
    # 1. Remove admin antigo se existir (para garantir a senha nova)
    user = db.query(UsuarioDB).filter(UsuarioDB.username == "admin").first()
    if user:
        db.delete(user)
        db.commit()
        print("🗑️ Admin antigo removido.")

    # 2. Cria o novo admin com a senha certa
    senha_criptografada = get_password_hash("Carper@153")
    
    novo_admin = UsuarioDB(
        username="admin",
        password_hash=senha_criptografada,
        nome_completo="Super Administrador",
        cpf="000.000.000-00",
        setor="TI",
        cargo="Gestor"
    )
    
    db.add(novo_admin)
    db.commit()
    
    print("\n✅ SUCESSO! Usuário criado.")
    print("👤 Login: admin")
    print("🔑 Senha: 123")

if __name__ == "__main__":
    resetar_admin()