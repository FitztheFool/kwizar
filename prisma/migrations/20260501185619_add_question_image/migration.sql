-- add_question_image: added imageUrl to questions and quizzes
ALTER TABLE "questions" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "quizzes" ADD COLUMN "imageUrl" TEXT;
