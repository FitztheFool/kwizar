# Migration à exécuter

## 1. Ajoutez dans prisma/schema.prisma, dans le model Question :

```prisma
model Question {
  # ... champs existants ...
  strictOrder Boolean @default(false)   # ← AJOUTER CETTE LIGNE
}
```

## 2. Lancez la migration :

```bash
npx prisma migrate dev --name add_strict_order
```

## 3. Pensez aussi à vérifier app/api/quiz/[id]/submit/route.ts

Dans la validation MULTI_TEXT, remplacez la logique actuelle par :

```typescript
if (question.type === 'MULTI_TEXT') {
  const userTextList = userAnswer?.freeText?.split('||').map(t => t.trim().toLowerCase()) ?? [];
  const correctTextList = correctAnswers.map(a => answerLabel(a).trim().toLowerCase());
  const strictOrder = (question as any).strictOrder ?? false;

  if (strictOrder) {
    isCorrect =
      userTextList.length === correctTextList.length &&
      userTextList.every((t, i) => t === correctTextList[i]);
  } else {
    isCorrect =
      userTextList.length === correctTextList.length &&
      userTextList.every(t => correctTextList.includes(t));
  }
}
```
