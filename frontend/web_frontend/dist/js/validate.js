// JavaScript Validation For Registration Page
window.$ = window.jQuery = require('../vendor/jquery/jquery.min.js');

function cancelForm(formName) {
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
        required: true
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
        required: "Please enter a tag"
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

function validateCreateProf() { // http://demos.codingcage.com/bs-form-validation/
  $("#addProfModalForm").validate({

    rules: {
      ctclass: {
        required: true,
        validClass: true
      },
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
        required: true
      }
    },
    messages: {
      ctclass: {
        required: "Please enter a valid class name",
        validClass: "Name must contain only alphabets, numbers, space and dash"
      },
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
        required: "Please enter a tag"
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
      $("#addProfModal").modal("hide");
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

function validateEditProf() {
  $("#editProfModalForm").validate({

    rules: {
      etclass: {
        validName: true
      },
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
      editProfSubmit($(form).find('#editProfId').attr('value'));
      $("#editProfModal").modal("hide");
    }
  });

}

function validateStudentCreateLeaveRequest() {
  $("#addLeaveRequestForm").validate({

    rules: {
      csdate: {
        validDateTime: true
      },
      cedate: {
        validDateTime: true
      }
    },
    messages: {
      csdate: {
        validDateTime: "Date format DD-MM-YYYY hh:mm",
        required: "This field is required"
      },
      cedate: {
        validDateTime: "Date format DD-MM-YYYY hh:mm",
        required: "This field is required"
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
      var date1, date2,missedTest,reason,reasonDesc,proof,where;
      date1 = moment(document.getElementById("csdate").value, "DD-MM-YYYY H:mm").format();
      date2 = moment(document.getElementById("cedate").value, "DD-MM-YYYY H:mm").format();
      missedTest = document.getElementById("cmissedTest").checked;
      reason = $('input[name="reasonradio"]:checked').val();
      reasonDesc = document.getElementById("creasonDesc").value;
      proof = $('input[name="proofradio"]:checked').val();;
      where = document.getElementById("cplace").value;
      createLeaveRequest(date1, date2, missedTest, reason, reasonDesc, proof, where, () => {
        getLRForStudent("LRTable", () => {

        });
      });
      $("#addLeaveRequest").modal("hide");
    }
  });

}

function validateProfCreateLeaveRequest() {
  $("#addLeaveRequestForm").validate({

    rules: {
      csdate: {
        validDateTime: true
      },
      cedate: {
        validDateTime: true
      }
    },
    messages: {
      csdate: {
        validDateTime: "Date format DD-MM-YYYY hh:mm",
        required: "This field is required"
      },
      cedate: {
        validDateTime: "Date format DD-MM-YYYY hh:mm",
        required: "This field is required"
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
      var date1, date2,missedTest,reason,reasonDesc,proof,where;
      date1 = moment(document.getElementById("csdate").value, "DD-MM-YYYY H:mm").format();
      date2 = moment(document.getElementById("cedate").value, "DD-MM-YYYY H:mm").format();
      var studentID = $("#stdListSelect").val();
      missedTest = document.getElementById("cmissedTest").checked;
      reason = $('input[name="reasonradio"]:checked').val();
      reasonDesc = document.getElementById("creasonDesc").value;
      proof = $('input[name="proofradio"]:checked').val();;
      where = document.getElementById("cplace").value;
      createLeaveRequest(date1, date2, missedTest, reason, reasonDesc, proof, where, () => {
        getLR("LRTable", () => {

        });
      }, studentID);
      $("#addLeaveRequest").modal("hide");
    }
  });

}

function activateValidator() {
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
  $.validator.addMethod("validDateTime", function(value, element) {
    return this.optional(element) || moment(value, "DD-MM-YYYY H:mm", true).isValid();
  });

  $.validator.addMethod("validTime", function(value, element) {
    return this.optional(element) || moment(value, "HH:MM").isValid();
  });
  var classregex = /^[a-zA-Z1-9 \-]+$/;
  $.validator.addMethod("validClass", function(value, element) {
  return this.optional(element) || classregex.test(value);
  });
  var usernameregex = /^[a-zA-Z1-9\-\.\_]+$/;
  $.validator.addMethod("validUsername", function(value, element) {
    return this.optional(element) || usernameregex.test(value);
  });
  if (require('electron').remote.getGlobal('currentPage') == window.PAGES.PROFS) {
    validateCreateStd();
    validateEditStd();
  } else if (require('electron').remote.getGlobal('currentPage') == window.PAGES.ADMIN) {
    validateCreateProf();
    validateEditProf();
  } else if (require('electron').remote.getGlobal('currentPage') == window.PAGES.LEAVEREQ_STUDENT) {
    validateStudentCreateLeaveRequest();
  } else if (require('electron').remote.getGlobal('currentPage') == window.PAGES.LEAVEREQ_PROF) {
    validateProfCreateLeaveRequest();
  }
}
