// Dans quiz/[id]/page.tsx — ajouter cet emit dans handleNextQuestion
// APRÈS avoir mis à jour currentQuestionIndex, AVANT le submitQuiz

// Dans handleNextQuestion, remplacer le bloc "else" par :
} else {
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setSelectedAnswer('');
    setSelectedAnswers([]);
    setFreeTextAnswer('');
    setMultiTextAnswers([]);
    setShowFeedback(false);
    setIsCorrect(false);

    // ✅ Émet la progression en temps réel aux autres joueurs
    if (lobbyCode) {
        socket.emit('lobby:playerProgress', {
            currentQuestion: nextIndex + 1,       // question sur laquelle il arrive (1-indexed)
            totalQuestions: quiz.questions.length,
        });
    }
}

// Et au montage du quiz (dans fetchQuiz, après setQuiz(data)), ajouter :
if (lobbyCode) {
    socket.emit('lobby:playerProgress', {
        currentQuestion: 1,
        totalQuestions: data.questions.length,
    });
}
