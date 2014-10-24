// Require sudo on unix platforms
if(process.platform !== 'win32'){
  if(process.env.USER !== "root"){
    console.log("What? Make it yourself.");
    process.exit();
  }
}

// Require the libraries.
var async =   require('async'),
    $ =       require('jquerygo'),
    prompt =  require('prompt'),
    config =  require('nconf'),
    path =    require('path'),
    fs =      require('fs'),
    moment =      require('moment');

// Function to easily get a configuration or prompt for it...
var get = function(param, value, done) {
  var self = this;

  // Allow them to provide a done function.
  if (typeof value === 'function') {
    done = value;
    value = null;
  }

  // Get the parameter name.
  var paramName = (typeof param === 'string') ? param : param.name;
  if (value) {
    config.set(paramName, value);
  }
  else {
    value = config.get(paramName);
  }

  if (!value) {
    prompt.get([param], function (err, result) {
      value = result[paramName];
      config.set(paramName, value);
      done(null, value);
    });
  }
  else if(done) {
    done(null, value);
  }
  else {
    return value;
  }
};

// Load the configuration from -o first, else default config if exists
config.argv().env();

var configFile = config.get('o');
if (configFile) {
  config.file({file: configFile});
}
else {
  if(process.platform == 'win32'){
    configFile = path.join(__dirname,'config.json');
  } else {
    configFile =  path.sep + 'etc' + path.sep + 'mmas' + path.sep + 'config.json';
  }

  fs.exists(configFile, function(exists) {
    if(exists){
      config.file({file:configFile});
    }
  });
}

/**
 * Method to capture and ensure the screenshots directory exists.
 */
var capture = function(fileName) {
  // Return the async function.
  return function(done) {

    // The directory to store the screenshots.
    var dir = __dirname + '/../screenshots';

    // Check that the directory exists.
    fs.exists(dir, function(exists) {
      if (exists) {
        $.capture(dir + '/' + fileName + '.png', done);
      }
      else {
        fs.mkdir(dir, function(err) {
          if (err) return done(err);
          $.capture(dir + '/' + fileName + '.png', done);
        });
      }
    });
  };
};

/**
 * A method to capture the debug name.
 */
var debugCapture = function(fileName) {
  if (config.get('debug')) {
    return capture(fileName);
  }
  return function(done) { done(); };
};

// Start the prompt.
prompt.start();

// Lunchtime hasn't jquery.
$.config.site = 'https://www.lunchtime.lu';

/**
 * Input a value.
 *
 * @param {type} selector
 * @param {type} value
 * @param {type} done
 * @returns {undefined}
 */
var input = function(selector, value, done) {
  $(selector).val(value, function() {
    this.blur(done);
  });
};

/**
 * Helper to set an input within an async series.
 * @param {type} selector
 * @param {type} config
 * @returns {unresolved}
 */
var setInput = function(selector, param, direct) {
  direct = !!direct;
  return function(done) {
    if (direct) {
      input(selector, config.get(param), done);
    }
    else {
      get(param, function(err, value) {
        input(selector, value, done);
      });
    }
  };
};

/**
 * Select a value.
 *
 * @param {type} selector
 * @param {type} value
 * @param {type} done
 * @returns {undefined}
 */
var select = function(selector, value, done) {
  if (value) {
    $(selector + ' li:contains("' + value + '") a:eq(0)').click(function() {
      this.blur(done);
    });
  }
  else {
    done();
  }
};

/**
 * Helper to select a value within an async series.
 * @param {type} selector
 * @param {type} value
 * @returns {unresolved}
 */
var selectVal = function(selector, param, direct) {
  direct = !!direct;
  return function(done) {
    selector += 'SelectBoxItOptions';
    if (direct) {
      var value = config.get(param);
      if (!value) {
        value = param;
      }
      select(selector, value, done);
    }
    else {
      get(param, function(err, value) {
        select(selector, value, done);
      });
    }
  };
};

/**
 * Helper to print something when it is executed.
 *
 * @param {type} text
 * @returns {unresolved}
 */
var print = function(text) {
  return function(done) {
    console.log(text);
    done();
  };
};

/**
 * Helper function to take a pause...
 *
 * @param {type} time
 * @returns {unresolved}
 */
var sleep = function(time) {
  return function(done) {
    setTimeout(done, time);
  };
};

/**
 * Login to Lunchtime.
 */
var login = function(done) {
  async.series([
    print('Logging in.'),
    $.go(false, 'visit', '/glitter/index.asp'),
    $.go(false, 'waitForElement', '#txtUserName'),
    debugCapture('login1'),
    setInput('#txtUserName', 'email'),
    debugCapture('login2'),
    setInput('#txtPassword', { name: 'password', hidden: true}),
    debugCapture('login3'),
    $('#btnGo').go(false, 'click'),
    sleep(3000),
    debugCapture('login4'),
    print('Successfully logged in.'),
  ], done);
};

/**
 * Fill out the new delivery stuff..
 * @param {type} done
 * @returns {undefined}
 */
var goToOrderPage = function(done) {
  var now = moment(new Date()); //.add(1, 'd');
  async.series([
    print('Go to order page.'),
    $.go(false, 'visit', '/glitter/order-menu.asp?t=0&str_date=' + now.format('YYYYMMDD')),
    $.go(false, 'waitForElement', '.order-line'),
    debugCapture('orderPage1'),
    print('Navigated to order page.'),
  ]); // dunno why yet but if set done here the next set unsync
};

/**
 * Select your sandwich on the page.
 *
 * @param {type} done
 * @returns {selectSandwich}
 */
var selectSandwich = function(done) {
  var sandwich = config.get('sandwich');
  if (!sandwich) {
    console.log('No sandwich specified in your config file.');
    done(true);
  }
  else {
    sandwich = sandwich.toLowerCase();
    var found = false, selection = 0, query = '.order-line';

    // Iterate over each sandwich.
    $(query).each(function(index, item, eachDone) {
        $(query + ':eq(' + index + ') em[title]').attr('title', function(title) {
        if (title.toLowerCase() == sandwich) {
          selection = index;
          found = true;
        }
        eachDone();
      });
    }, function() {
      if (!found) {
        console.log('Could not find your sandwich.');
        done();
      }
      else {
        // Select this sandwich.
        query += ':eq(' + selection + ') .order-input :input';
        console.log('Sandwich found at index ' + selection);
        $(query).click(function() {
            console.log('element clicked');
            done();
        });
      }
    });
  }
};

/**
 * Now checkout...
 * @param {type} done
 * @returns {undefined}
 */
var checkout = function(done) {
  async.series([
    print('Checking out...'),
    debugCapture('checkout1'),
    $.go(false, 'waitForElement', '#btn_order'),
    $('#btn_order').go(false, 'click'),
    sleep(2000),
    debugCapture('checkout2'),
    $(':input[value="Confirmez votre commande"]').go(false, 'click'),
    $.go(false, 'waitForPage'),
    debugCapture('complete'),
    print('Delivery on its way! Order details at ' + __dirname + '/../screenshots/complete.png')
  ], done);
};

// Order a sandwich!!!
async.series([
  login,
  goToOrderPage,
  selectSandwich,
  checkout
], function() {
  $.close();
});
