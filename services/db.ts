import { createClient } from '@libsql/client/web';

const TURSO_URL = 'libsql://store-app-yousif10-sf.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU2NjcxNTUsImlkIjoiMDE5ZDZlMDAtZGMwMS03MTVmLWE4YjUtMGFlOGE5ZDg3OGJhIiwicmlkIjoiOTlhMDE5NmYtYTA0Ni00ZDRjLTk1YjMtNGZjYmQwZDJlOWZhIn0.mcog-aKrLbxf1NTyvStrSOjkLQpaSaof3KanSfXBU5-gj8fw3R2ptI4ivo2q_S3DBdIF3yJKkAiXzH9lyW_FAg';

export const db = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});
