# Configuração do Firebase

Esta landing page continua usando HTML, CSS e JavaScript puro. O Firebase é carregado diretamente pelo CDN oficial, sem npm ou build.

## 1. Criar e conectar o projeto

1. No Firebase Console, crie um projeto.
2. Em **Configurações do projeto > Seus apps**, adicione um aplicativo Web.
3. Copie os valores de `firebaseConfig` para `assets/js/firebase-config.js`.
4. Em **Authentication > Sign-in method**, habilite **E-mail/senha**.
5. Em **Authentication > Users**, crie o primeiro administrador.
6. Crie o **Cloud Firestore** e o **Cloud Storage**.

## 2. Publicar as regras

Copie `firestore.rules` para **Firestore Database > Rules** e `storage.rules` para **Storage > Rules**, publicando ambos.

As regras deixam a landing page pública para leitura e exigem login para alterações e uploads. Se futuramente existirem usuários sem poder administrativo, evolua a autorização para custom claims.

## 3. Construir a base inicial

Não é necessário criar coleções manualmente. Depois de configurar o Firebase:

1. Abra `admin/` por HTTP/HTTPS (não diretamente com `file://`).
2. Entre com o administrador criado no Authentication.
3. Clique em **Salvar**.

Quando o conteúdo remoto ainda não existe, o painel carrega `data/site.json`. Ao salvar, cria automaticamente `sites/ces` com `content`, `updatedAt` e `updatedBy`. O front escuta esse documento e renderiza alterações em tempo real.

## 4. Imagens

Em **Hero**, cada slide possui **Alterar imagem**. O arquivo vai para `sites/ces/` no Cloud Storage e sua URL é salva no documento. Arquivos acima de 10 MB ou que não sejam imagens são recusados no cliente e nas regras.

## Desenvolvimento local

Sirva a pasta com um servidor estático, por exemplo `npx serve .` ou Live Server. Se necessário, adicione o domínio em **Authentication > Settings > Authorized domains**.
