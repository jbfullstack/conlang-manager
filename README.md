# conlang-manager

Personnal language manager

# Install

npm install

### Start the app

```bash
./scripts/start.sh
npm run dev
```

### Stop the app

```bash
./scripts/stop.sh
```

### Aligne Db with schemas

```bash
npx prisma generate
npm run db:push
npm run db:seed
npx prisma studio
```
