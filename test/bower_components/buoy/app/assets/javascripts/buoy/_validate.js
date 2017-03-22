$(function() { 

 // create placeholder data attributes so the original placeholder is stored
  $('form[data-validate="true"] input, form[data-validate="true"] textarea').each(function(){
    var currentField = $(this);
    var placeholderValue = currentField.attr('placeholder');

    currentField.attr('data-placeholder', placeholderValue);
  });

  var formValid = false;

  function checkAllValid(parentForm){
    var selectWrap = parentForm.find('.is-requiredSelect');
    var numSelects = selectWrap.length;
    var formGroup = parentForm.find('.formGroup.is-required');
    var groupChecked = parentForm.find('.formGroup.is-required :checkbox:checked');
    var numGroups = formGroup.length;
    var checkValidated = true;
    var inputsValid = true;
    var selectsValid = true;
    var submit = parentForm.find('input[type="submit"]');


    //check for select menus
    if(numSelects > 0) {
      selectWrap.each(function(){
        var thisSelect = $(this);
        var selected = thisSelect.find("option:selected");

        if(selected.hasClass('placeholder')){
          selectsValid = false;
        }
      });
    }

    //check for checkbox groups
    if(numGroups > 0) {
      formGroup.each(function(i){
        var thisGroup = $(this);
        var isChecked = thisGroup.find(":checkbox").is(':checked');
        
        if(!isChecked) {
          checkValidated = false; 
        } 
      });
    }

    //Check for text inputs and textareas
    parentForm.find('input, textarea').each(function(){
      var isValid = $(this)[0].checkValidity();

      if (!isValid){
        inputsValid = false;
      }
    });

    if (checkValidated && inputsValid && selectsValid) {
      formValid = true;
    } else {
      formValid = false;
    }

    // the disabled button boolean will be the opposite state of formValid - so if all fields are falid, the disabled state is false (turned on)
    submit.prop('disabled', !formValid);
  }


  // Form validation
  $('form[data-validate="true"] input, form[data-validate="true"] textarea, form[data-validate="true"] select').on('keyup change', function (e) {
    
    var currentField = $(this);
    var parentForm = currentField.closest('form[data-validate="true"]');
    var placeholderValue = currentField.attr('placeholder');
    var inputWrap = currentField.closest('.FloatLabel');
    var currentValid = currentField[0].checkValidity();
    var originalPlaceholder = currentField.data('placeholder');

    
    if(currentValid) {

      //if a field is not required and doesnt have a value it should not show check mark
      if (currentField.val() !== '') {
        inputWrap.addClass("validatePass");
        inputWrap.removeClass("validateFail");
        inputWrap.closest('.FloatLabel').removeClass('is-required');

        //reset label back to correct state
        currentField.next(".FloatLabel-label").text(originalPlaceholder);

      } else {
        inputWrap.removeClass("validatePass");
      }

      //if value is blank, dont add this
    } else {
      inputWrap.removeClass("validatePass");

      //if field is blank and there is an error, dont show the error state
      if (currentField.val() === '') {
        
        inputWrap.closest('.FloatLabel').addClass('is-required');

        if (!inputWrap.hasClass("validateFail")) {
          currentField.next('label').removeClass('is-visible');
          currentField.removeClass('is-active');
        } else {
          currentField.next('label').addClass('is-visible');
          currentField.addClass('is-active');
        }
      } else {
        inputWrap.closest('.FloatLabel').addClass('is-required');
      }
    }

    checkAllValid(parentForm);
  });

  $('form[data-validate="true"] select').on('change', function () {
    var thisSelect = $(this);
    var selected = thisSelect.find("option:selected");

    //if there is a selected option
    if(selected.length) {
      thisSelect.next('.chosen-container').find('.chosen-single span').addClass('validatePass');
    }
  });


    

  //we dont want to bother the user with an error state before they switch fields, so we want error handeling to happen on change
  $('form[data-validate="true"] input, form[data-validate="true"] textarea').on('blur', function (e) {
    var currentField = $(this);
    var parentForm = currentField.closest('form[data-validate="true"]');
    var placeholderValue = currentField.attr('placeholder');
    var fieldTitle = currentField.attr('title');
    var errorMsg = fieldTitle;
    var inputWrap = currentField.closest('.FloatLabel');
    var currentValid = currentField[0].checkValidity();
    var submit = parentForm.find('input[type="submit"]');
    var originalPlaceholder = currentField.data('placeholder');


    if (!currentValid) {
      //add error icon
      inputWrap.addClass("validateFail");

      //if no title exists on input, we have a fallback error message
      if (fieldTitle === undefined) {
        errorMsg = 'cannot be blank';
      }
      currentField.next('label').addClass('is-visible').text(originalPlaceholder + ' ' + errorMsg);
      currentField.addClass('is-active');

    } else {
      inputWrap.removeClass("validateFail");
      currentField.attr("placeholder", originalPlaceholder);
    }
  });
});


// on load, after floatlabels is loaded, we add required classes to the floatlabel wrapper
$(window).load(function() {
  $('form[data-validate="true"] input, form[data-validate="true"] textarea').each(function(){
    var currentField = $(this);

    if(currentField.prop('required')){
      currentField.closest('.FloatLabel').addClass('is-required');
    }
  });
});