// JavaScript Validation For Registration Page
window.$ = window.jQuery = require('../vendor/jquery/jquery.min.js');
function cancelForm(formName)
{
  $(formName).validate().resetForm();
  $(formName + ' span[id="error"]').html("");
}
function validateCreateStd() { // http://demos.codingcage.com/bs-form-validation/
  $("#addStudentForm").validate({

    rules: {
      cfname: {
        required: true,
        validName: true
      },
      clname: {
        required: true,
        validName: true
      },
      cusername: {
        required: true,
        validUsername: true
      },
      cdob: {
        required: false,
        validDate: true
      },
      cemail: {
        required: false,
        validEmail: true
      },
      ctag: {
        required: true,
        validTag: true
      }
    },
    messages: {
      cfname: {
        required: "Please enter a first name",
        validName: "Name must contain only alphabets, space and dash"
      },
      clname: {
        required: "Please enter a last name",
        validName: "Name must contain only alphabets, space and dash"
      },
      cusername: {
        required: "Please enter a username",
        validUsername: "Only a-z A-Z 1-9 . - _ accepted"
      },
      cdob: {
        validDate: "Date format DD-MM-YYYY"
      },
      cemail: {
        required: "Please enter an email",
        validEmail: "Please enter as the following format : test@test.com"
      },
      ctag: {
        required: "Please enter a tag",
        validTag: "Only a-z 1-9 and space char are allowed"
      }
    },
    errorPlacement: function(error, element) {
      $(element).closest('.form-group').find('.help-block').html(error.html());
    },
    highlight: function(element) {
      $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
      $(element).closest('.form-group').find('.help-block').html('');
    },

    submitHandler: function(form) {
      submitCreateModal();
    }
  });

}
function validateEditStd() {
  $("#editStudentForm").validate({

    rules: {
      efname: {
        validName: true
      },
      elname: {
        validName: true
      },
      eusername: {
        validUsername: true
      },
      edob: {
        validDate: true
      },
      eemail: {
        validEmail: true
      },
      etag: {
        validTag: true
      }
    },
    messages: {
      efname: {
        validName: "Name must contain only alphabets, space and dash"
      },
      elname: {
        validName: "Name must contain only alphabets, space and dash"
      },
      eusername: {
        validUsername: "Only a-z A-Z 1-9 . - _ accepted"
      },
      edob: {
        validDate: "Date format DD-MM-YYYY"
      },
      eemail: {
        validEmail: "Please enter as the following format : test@test.com"
      },
      etag: {
        validTag: "Only a-z 1-9 and space char are allowed"
      }
    },
    errorPlacement: function(error, element) {
      $(element).closest('.form-group').find('.help-block').html(error.html());
    },
    highlight: function(element) {
      $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
      $(element).closest('.form-group').find('.help-block').html('');
    },

    submitHandler: function(form) {
      submitEditModal($(form).find('#editStudentID').attr('value'));

    }
  });

}
$('document').ready(function() {
  // name validation
  var nameregex = /^[a-zA-Z \-]+$/;
  var moment = require("electron").remote.require("moment");
  $.validator.addMethod("validName", function(value, element) {
    return this.optional(element) || nameregex.test(value);
  });

  // valid email pattern
  var eregex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

  $.validator.addMethod("validEmail", function(value, element) {
    return this.optional(element) || eregex.test(value);
  });

  $.validator.addMethod("validDate", function(value, element) {
    return this.optional(element) || moment(value, "DD-MM-YYYY", true).isValid();
  });

  $.validator.addMethod("validTime", function(value, element) {
    return this.optional(element) || moment(value, "HH:MM").isValid();
  });
  var usernameregex = /^[a-zA-Z1-9 \-\.\_]+$/;
  $.validator.addMethod("validUsername", function(value, element) {
    return this.optional(element) || usernameregex.test(value);
  });

  var tagregex = /^[a-z1-9 ]+$/;
  $.validator.addMethod("validTag", function(value, element) {
    return this.optional(element) || tagregex.test(value);
  });

  validateCreateStd();
  validateEditStd();
});





/*function submitForm(){


			   /*$('#message').slideDown(200, function(){

				   $('#message').delay(3000).slideUp(100);
				   $("#register-form")[0].reset();
				   $(element).closest('.form-group').find("error").removeClass("has-success");

			   });

			   alert('form submitted...');
			   $("#register-form").resetForm();

		   }*/