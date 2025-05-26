// Skapar en ny router-instans för att definiera och organisera alla admin-relaterade endpoints
const express = require("express");
const router = express.Router();

// Middleware för autentisering och rollkontroll
const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../middleware/videoUpload");

// Importerar kontrollfunktioner från alla controllers
const { 
  getUnreadNotifications, 
  markNotificationAsRead , 
  getAllUsers, 
  getAdminStatistics, 
  deleteUser
} = require("../controllers/adminController");

const { 
  uploadVideo, 
  getAllVideos, 
  deleteVideo, 
  updateVideo,
  getVideosBySectionId 
} = require("../controllers/videoController");


const {
  createTest,
  getTestsBySectionId,
  deleteTest,
  updateTest
} = require("../controllers/testController");

const {
  createQuestion,
  createAnswer,
  getQuestionsForTest,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  updateAnswer
} = require("../controllers/questionController");

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createSection,
  getSections,
  getSectionById,
  updateSection,
  deleteSection
} = require("../controllers/sectionController");

const {
  createPost,
  votePost,
  getAllForumPosts,
  getPostWithAnswers,
  answerPost,
  deletePost,
  deleteAnswer
} = require("../controllers/forumController");


const {
  getAllMessages,
  replyToMessage,
  sendGlobalMessage,
  getAdminMessageThread,
  replyToThread,
  sendPrivateMessageToUser,
  deleteMessage
} = require("../controllers/globalMessageController");

const {
  getWordById,
  searchVocabulary,
  getLettersByLevel,
  getWordsByLevelAndLetter,
  addWord,
  updateWord,
  deleteWord
} = require("../controllers/vocabularyController");



// Admin Dashboard
router.delete("/users/:id", authMiddleware, isAdmin, deleteUser);
router.get("/statistics", authMiddleware, isAdmin, getAdminStatistics);
router.get("/users", authMiddleware, isAdmin, getAllUsers); 

// Kategorier
router.post("/categories", authMiddleware, isAdmin, createCategory);
router.get("/categories", authMiddleware, isAdmin, getCategories);
router.get("/categories/:id", authMiddleware, isAdmin, getCategoryById);
router.put("/categories/:id", authMiddleware, isAdmin, updateCategory);
router.delete("/categories/:id", authMiddleware, isAdmin, deleteCategory);

// Sektioner
router.post("/sections", authMiddleware, isAdmin, createSection);
router.get("/sections", authMiddleware, isAdmin, getSections);
router.get("/sections/:id", authMiddleware, isAdmin, getSectionById);
router.put("/sections/:id", authMiddleware, isAdmin, updateSection);
router.delete("/sections/:id", authMiddleware, isAdmin, deleteSection);

//Tester
router.post("/tests", authMiddleware, isAdmin, createTest);
router.get("/sections/:id/tests", authMiddleware, isAdmin, getTestsBySectionId);
router.get("/tests/:testId/questions", authMiddleware, isAdmin, getQuestionsForTest);
router.post("/tests/:testId/questions", authMiddleware, isAdmin, createQuestion);
router.get("/questions/:questionId", authMiddleware, isAdmin, getQuestionById);
router.put("/questions/:questionId", authMiddleware, isAdmin, updateQuestion);
router.delete("/questions/:questionId", authMiddleware, isAdmin, deleteQuestion);
router.post("/questions/:questionId/answers", authMiddleware, isAdmin, createAnswer);
router.put("/answers/:id", authMiddleware, isAdmin, updateAnswer);
router.put("/tests/:id", authMiddleware, isAdmin, updateTest);

// Forum
router.get("/forum", authMiddleware, getAllForumPosts);
router.post("/forum", authMiddleware, createPost);
router.get("/forum/:postId", authMiddleware, getPostWithAnswers);
router.post("/forum/:postId/answer", authMiddleware, isAdmin, answerPost);
router.delete("/forum/:postId", authMiddleware, isAdmin, deletePost);
router.delete("/forum/answer/:answerId", authMiddleware, isAdmin, deleteAnswer);
router.post("/forum/:postId/vote", authMiddleware, votePost);


// Meddelanden 
router.post("/global-message", authMiddleware, isAdmin, sendGlobalMessage);
router.get("/messages/thread/:messageId", authMiddleware, isAdmin, getAdminMessageThread);
router.post("/messages/thread/:messageId", authMiddleware, isAdmin, replyToThread);
router.delete("/tests/:id", authMiddleware, isAdmin, deleteTest);
router.get("/messages", authMiddleware, isAdmin, getAllMessages);
router.post("/messages/:messageId/reply", authMiddleware, isAdmin, replyToMessage);
router.post("/private-message", authMiddleware, isAdmin, sendPrivateMessageToUser);

// Videor
router.put("/videos/:id", authMiddleware, isAdmin, updateVideo);
router.delete("/videos/:id", authMiddleware, isAdmin, deleteVideo);
router.delete("/messages/:messageId", deleteMessage);
router.post("/videos/upload", authMiddleware, isAdmin, upload.single("video"), uploadVideo);
router.get("/sections/:id/videos", authMiddleware, isAdmin, getVideosBySectionId);
router.get("/videos", authMiddleware, isAdmin, getAllVideos);

// Ordförråd
router.post("/vocabulary", authMiddleware, isAdmin, addWord);
router.put("/vocabulary/:id", authMiddleware, isAdmin, updateWord);
router.delete("/vocabulary/:id", authMiddleware, isAdmin, deleteWord);
router.get("/vocabulary/letters", authMiddleware, getLettersByLevel);
router.get("/vocabulary", authMiddleware, getWordsByLevelAndLetter);
router.get("/vocabulary/search", authMiddleware, searchVocabulary);
router.get("/vocabulary/:id", authMiddleware, isAdmin, getWordById);
router.put("/notifications/:id/read", authMiddleware, isAdmin, markNotificationAsRead);
router.get("/notifications", authMiddleware, isAdmin, getUnreadNotifications);
router.put("/notifications/:id/read", authMiddleware, isAdmin, markNotificationAsRead);

// Exporterar router så att den kan användas i servern 
module.exports = router;
