var start; // used to initialize the app

$(document).ready(function() {
  // Load default questions if no flashcards are found in localStorage
  for(var key in flashcards) {
      $('.flashcard-set-checkbox-container').append('<input type="checkbox" class="flashcard-set-checkbox" name="' + key + '" value="' + key + '" /> ' + key + "<br />");
  }
  $('.flashcard-set-checkbox:first').prop('checked', true);
  $('.flashcard-set-checkbox-container').append('<input type="button" id="change-sets" value="Select sets" /><br /><input type="button" id="select-all-sets" value="Select all"/>');
  $('#change-sets').click(loadSets);
  $('#select-all-sets').click(selectAllSets);
  loadSets();
});

function selectAllSets() {
    $('.flashcard-set-checkbox').prop('checked', true);
    loadSets();
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function loadSets(){
    var cardArray = [];
    $('.flashcard-set-checkbox:checked').each(function() {
                                                  cardArray = cardArray.concat(flashcards[$(this).val()]);
                                              });
    shuffle(cardArray);
    ouicards.loadFromArray(cardArray);
    initializeHandlers();
}

  // Correct and wrong answer functionality
  function correct() {
    if (!start) {
      console.log(start);
      start = true;
      changeQuestion();
      return;
    }

    ouicards.correct();
    changeQuestion();
    updateFooter();
  }

  function wrong() {
    if (!start) {
      start = true;
      changeQuestion();
      return;
    }

    ouicards.wrong();
    changeQuestion();
    updateFooter();
  }

    function showCorrect() {
        $('.answer-form').hide();
        $('.answer-display').html('<div id="answer-preamble">Correct!</div> <input type="button" id="next-question" value="Next" />').addClass('correct-answer').show();
        $('#next-question').unbind().click(function() {
                                               $('.answer-display').html("").hide().removeClass('correct-answer');
                                               correct();
                                           });
    }

    function showWrong(correctAnswer) {
        $('.answer-form').hide();
        $('.answer-display').html('<div id="answer-preamble">Well, crap! The correct answer was:</div><div id="answer-container"></div><input type="button" id="next-question" value="Next" />').addClass('wrong-answer');
        $('#answer-container').html(correctAnswer);
        $('.answer-display').show();
        $('#next-question').unbind().click(function() {
                                               $('.answer-display').html("").hide().removeClass('wrong-answer');
                                               wrong();
                                           });
    }

  function checkAnswer(rawAnswer) {
      if (typeof rawAnswer == "string") {
          return rawAnswer.toLowerCase().trim() == $($('.answer-input')[0]).val().toLowerCase().trim();
      }
      if(typeof rawAnswer == "object") {
          var lowerTrimmedRawAnswers = [];
          for (var i in rawAnswer.answers) {
              lowerTrimmedRawAnswers.push(rawAnswer.answers[i].toLowerCase().trim());
          }
          var lowerTrimmedUserAnswers = [];
          for (i = 0; i < $('.answer-input').length; i++) {
              lowerTrimmedUserAnswers.push($($('.answer-input')[i]).val().toLowerCase().trim());
          }
          var remainingAnswers = [];
          for (i in lowerTrimmedUserAnswers) {
              if(!lowerTrimmedRawAnswers.includes(lowerTrimmedUserAnswers[i])) {
                  remainingAnswers.push(lowerTrimmedUserAnswers[i]);
              }
          }
          return remainingAnswers.length == 0;
      }
      return false;
  }

  function renderQuestion(question) {
      console.log("I'm rendering the question");
      console.log(question);
      if (typeof question.rawQuestion == "string") {
          $('.question').html(question.question);
      }
      if (typeof question.rawQuestion == "object") {
          console.log("It's an object");
          console.log(question.rawQuestion);
          if ('container' in question.rawQuestion) {
              $('.question').html(question.rawQuestion.container);
          }
          if ('render' in question.rawQuestion && typeof question.rawQuestion.render == 'function') {
              console.log("I'm about to render");
              question.rawQuestion.render();
          }
      }
  }

  function changeQuestion() {
      var newQuestion = ouicards.next();
      
      if (newQuestion === undefined) {
          console.log('Trying to load an undefined question into the DOM.');
          return;
      }
      console.log("Changing question to " + newQuestion.question);
      
      renderQuestion(newQuestion);
      $('.answer-display').hide();
      if(typeof newQuestion.rawAnswer == "string") {
          $('.answer-input-container').html('<input type="text" class="answer-input" />');
      }
      if(typeof newQuestion.rawAnswer == "object") {
          var innerHtml = "";
          var size = 1;
          if(newQuestion.rawAnswer.type == "multi-part") {
              size = newQuestion.rawAnswer.answers.length;
          }
          if (newQuestion.rawAnswer.type == "subset") {
              size = newQuestion.rawAnswer.size;
          }
          console.log("Size: " + size);
          for (var i = 0; i < size; i++) {
              innerHtml += '<input type="text" class="answer-input" /><br />';              
          }
          $('.answer-input-container').html(innerHtml);
      }
      setTimeout(function() { 
                     $($('.answer-input')[0]).focus();
                     console.log("I set the focus");
                 }, 0);
      $('.answer-form').show();
      $('#answer-submit').unbind().click(function() {
                                             if (checkAnswer(newQuestion.rawAnswer)) {
                                                 console.log('Answer matched, so showingCorrect');
                                                 showCorrect();
                                             }
                                             else {
                                                 console.log('Answer was wrong, so showingWrong');
                                                 showWrong(newQuestion.answer);
                                             }
                                         });
  }


  // Update footer info
  function updateFooter() {
    $('.questions-count').html(ouicards.flashcards.length + ' questions');
    $('#stat-details').text(ouicards.bucketA.length + ' - ' +
                            ouicards.bucketB.length + ' - ' +
                            ouicards.bucketC.length);
  }

function initializeHandlers() {
  // Unbind all events, in case the user loads new flashcard questions
  $('.correct').unbind();
  $('.wrong').unbind();
  $('.question').unbind();
  $('.answer').unbind();
  $('body').unbind();

  updateFooter();
  changeQuestion();
  $('body').keyup(function(event) { if(event.which == 13) {
                                           if($('.answer-form').is(':visible')) {
                                               console.log('.answer-form was visible so I answer-submited');
                                             $('#answer-submit').click();   
                                           }
                                           else if ($('.answer-display').is(':visible')) {
                                               console.log('answer-display was visible so I next-question-ed');
                                               $('#next-question').click();
                                           }
                                       }});
  $('#load-questions').on('click', function() {
    initializeHandlers(ouicards.loadFromBrowser('#questions-input-area', ','));
    changeQuestion();
    $('#questions-input-area').hide();
    $('.upload').css({"padding": "10px"});
    $('#load-questions').hide();
    $('.upload-questions-label').text("Upload New Questions");
    $('.upload-questions-label').show();
    $('.answer-display').hide();
    start = true;
  });

  
}
