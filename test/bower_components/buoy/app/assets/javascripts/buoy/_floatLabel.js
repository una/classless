$(function(){

  // input types that should have a float label
  var typeMatches = /text|password|email|number|search|url|tel/;

  $('input:not(.Input--noLabel)').each(function(){

    var thisElement     = $(this),
        floatField      = typeMatches.test(thisElement.attr('type'));
        placeholderText = thisElement.attr('placeholder');

    //make sure that we are dealing with an input that should have a float label
    if(floatField == true){
      floatSetup(thisElement, placeholderText);
    }
  });


  $('textarea:not(.Input--noLabel)').each(function(){
    var thisElement     = $(this),
        placeholderText = thisElement.attr('placeholder');

    //because all textareas will have floatlabels, no extra check needed
    floatSetup(thisElement, placeholderText);
  });

  function floatSetup(thisElement, placeholderText){

    //add necessary wrapper and label with placeholder text
    thisElement.wrap('<div class="FloatLabel"></div>');
    thisElement.after('<label for="" class="FloatLabel-label">' + placeholderText + '</label>');
    thisElement.addClass('FloatLabel-input');

    //transfer margin classes to float wrapper if they exist
    if (thisElement.attr('class')) {
      var classList = thisElement.attr('class').split(/\s+/);
      //go over classes
      $.each( classList, function(index, item){
        //check if class is a margin top utility to fix positioning
        if (item.indexOf("u-mt") > -1) {
          thisElement.parent().addClass(item);
          thisElement.removeClass(item)
        }
      });
    }

    //just adding and removing classes, let css do all the heavy lifting
    thisElement.on('blur', function() { 
        thisElement.parent().removeClass('is-focused');
    });
    thisElement.on('focus', function() { 
        thisElement.parent().addClass('is-focused');
    });
    thisElement.on('keyup blur change', function( e ) {
        checkValue( e, thisElement);
    });

    //make it so float labels dont animate when they start with a value
    if(thisElement.val().length){
      thisElement.addClass('is-notAnimated');
      thisElement.parent().addClass('is-active');
      window.setTimeout( function() {
        thisElement.removeClass('is-notAnimated');
      }, 100);
    }
  }

  function checkValue( e, thisElement ) {
      if( e ) {
          var keyCode         = e.keyCode || e.which;
          //on tab return
          if( keyCode === 9 ) { return; }                
      }

      //again let css do heavy lifting for animations and just switch classes
      if(thisElement.val().length){
        thisElement.parent().addClass('is-active');
      }else {
        thisElement.parent().removeClass('is-active');

      }
  }
});