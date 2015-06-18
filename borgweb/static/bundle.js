/**
  This file was autogenerated.
  See https://github.com/borgbackup/borgweb
*/
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var dateformat = require('dateformat');

/**
  ~~ Config ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
var cfg = {
  'logFilesList': [],
  'logFilesListHTML': '',
  'lastSelectedLog': NaN,
  'pollFrequency': 100
};

/**
  ~~ BorgBackup interaction ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
var noBackupRunning = function noBackupRunning(callback) {
  $.getJSON('/backup/status', function (resp) {
    var backupRunning = resp.rc === null;
    if (backupRunning) log('▶ Backup in progress');else log('✖ No backup in progress');
    callback(backupRunning);
  });
};
var pollBackupStatus = function pollBackupStatus(endpoint, ms, callback) {
  noBackupRunning(function (notRunning) {
    if (notRunning) {
      $('.navbar button[type=submit]').toggleClass('btn-success');
      $('.navbar button[type=submit]').toggleClass('btn-warning');
      $('.navbar button[type=submit]').text('▶ Start Backup');
      $.getJSON('/logs', updateLogFileList);
    } else {
      log('Polling backup status');
      $.getJSON('/backup/status', callback);
      setTimeout(ms, pollBackupStatus(endpoint, ms, callback));
    }
  });
};
var startBackup = function startBackup(force) {
  if (force) {
    log('Sending backup start request');
    $.post('/backup/start', {}, function () {
      $('.navbar button[type=submit]').toggleClass('btn-success');
      $('.navbar button[type=submit]').toggleClass('btn-warning');
      $('.navbar button[type=submit]').text('✖ Stop Backup');
      pollBackupStatus('/backup/status', cfg['pollFrequency'], function (res) {
        log('Received status update');
      });
    });
  } else if (force === undefined) noBackupRunning(startBackup);else log('*Not* sending backup start request');
};

/**
  ~~ Utility ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
var log = function log() {
  var args = Array.prototype.slice.call(arguments);
  var time = '[' + dateformat(new Date(), 'HH:MM:ss') + ']';
  args.unshift(time);
  console.log.apply(console, args);
  return this;
};
var isInt = function isInt(n) {
  return n % 1 === 0;
};
var success = function success(data) {
  logFiles = data.log_files;
};
var parseAnchor = function parseAnchor() {
  var url = window.location.href.toString();
  var idx = url.indexOf('#');
  var anchor = idx != -1 ? url.substring(idx + 1) : '';
  if (anchor) {
    var parts = anchor.split(';');
    var partsParsed = {};
    parts.forEach(function (e) {
      var pair = e.split(':');
      partsParsed[pair[0]] = pair[1];
    });
    return partsParsed;
  } else return { 'log': 0 };
};

/**
  ~~ UI updaters ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
var updateLogFileList = function updateLogFileList(logFiles) {
  log('Updating log file list');
  cfg.logFilesListHTML = [];
  $.each(logFiles.log_files, function (key, value) {
    cfg.logFilesListHTML += '<li><a href="#log:' + value[0] + '" onClick="window.displayThatLog(' + value[0] + ')">' + value[1] + '</a></li>';
  });
  $('#log-files').html(cfg.logFilesListHTML);
};
var renderLogFile = function renderLogFile(text) {
  log('Rendering: ' + text.log_file);
  $('#log-text').html(text.log_content);
};
var updateShownLogFile = function updateShownLogFile(that) {
  log('Updating log file list');
  var logNumber = NaN;
  if (!isInt(that)) {
    var anchor = parseAnchor();
    logNumber = anchor['log'];
  } else logNumber = that;

  var url = '/logs/' + logNumber + '/0::';
  log('Fetching ' + url);
  $.getJSON(url, renderLogFile);
};

/**
  ~~ UI callables ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
window.displayThatLog = function (that) {
  updateShownLogFile(that);
};
window.startBackup = startBackup;

/**
  ~~ Site init ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
$.getJSON('/logs', updateLogFileList);
updateShownLogFile();

},{"dateformat":2}],2:[function(require,module,exports){
/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

(function(global) {
  'use strict';

  var dateFormat = (function() {
      var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|'[^']*'|'[^']*'/g;
      var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
      var timezoneClip = /[^-+\dA-Z]/g;
  
      // Regexes and supporting functions are cached through closure
      return function (date, mask, utc, gmt) {
  
        // You can't provide utc if you skip other args (use the 'UTC:' mask prefix)
        if (arguments.length === 1 && kindOf(date) === 'string' && !/\d/.test(date)) {
          mask = date;
          date = undefined;
        }
  
        date = date || new Date;
  
        if(!(date instanceof Date)) {
          date = new Date(date);
        }
  
        if (isNaN(date)) {
          throw TypeError('Invalid date');
        }
  
        mask = String(dateFormat.masks[mask] || mask || dateFormat.masks['default']);
  
        // Allow setting the utc/gmt argument via the mask
        var maskSlice = mask.slice(0, 4);
        if (maskSlice === 'UTC:' || maskSlice === 'GMT:') {
          mask = mask.slice(4);
          utc = true;
          if (maskSlice === 'GMT:') {
            gmt = true;
          }
        }
  
        var _ = utc ? 'getUTC' : 'get';
        var d = date[_ + 'Date']();
        var D = date[_ + 'Day']();
        var m = date[_ + 'Month']();
        var y = date[_ + 'FullYear']();
        var H = date[_ + 'Hours']();
        var M = date[_ + 'Minutes']();
        var s = date[_ + 'Seconds']();
        var L = date[_ + 'Milliseconds']();
        var o = utc ? 0 : date.getTimezoneOffset();
        var W = getWeek(date);
        var N = getDayOfWeek(date);
        var flags = {
          d:    d,
          dd:   pad(d),
          ddd:  dateFormat.i18n.dayNames[D],
          dddd: dateFormat.i18n.dayNames[D + 7],
          m:    m + 1,
          mm:   pad(m + 1),
          mmm:  dateFormat.i18n.monthNames[m],
          mmmm: dateFormat.i18n.monthNames[m + 12],
          yy:   String(y).slice(2),
          yyyy: y,
          h:    H % 12 || 12,
          hh:   pad(H % 12 || 12),
          H:    H,
          HH:   pad(H),
          M:    M,
          MM:   pad(M),
          s:    s,
          ss:   pad(s),
          l:    pad(L, 3),
          L:    pad(Math.round(L / 10)),
          t:    H < 12 ? 'a'  : 'p',
          tt:   H < 12 ? 'am' : 'pm',
          T:    H < 12 ? 'A'  : 'P',
          TT:   H < 12 ? 'AM' : 'PM',
          Z:    gmt ? 'GMT' : utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
          o:    (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
          S:    ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10],
          W:    W,
          N:    N
        };
  
        return mask.replace(token, function (match) {
          if (match in flags) {
            return flags[match];
          }
          return match.slice(1, match.length - 1);
        });
      };
    })();

  dateFormat.masks = {
    'default':               'ddd mmm dd yyyy HH:MM:ss',
    'shortDate':             'm/d/yy',
    'mediumDate':            'mmm d, yyyy',
    'longDate':              'mmmm d, yyyy',
    'fullDate':              'dddd, mmmm d, yyyy',
    'shortTime':             'h:MM TT',
    'mediumTime':            'h:MM:ss TT',
    'longTime':              'h:MM:ss TT Z',
    'isoDate':               'yyyy-mm-dd',
    'isoTime':               'HH:MM:ss',
    'isoDateTime':           'yyyy-mm-dd\'T\'HH:MM:sso',
    'isoUtcDateTime':        'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\'',
    'expiresHeaderFormat':   'ddd, dd mmm yyyy HH:MM:ss Z'
  };

  // Internationalization strings
  dateFormat.i18n = {
    dayNames: [
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ],
    monthNames: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ]
  };

function pad(val, len) {
  val = String(val);
  len = len || 2;
  while (val.length < len) {
    val = '0' + val;
  }
  return val;
}

/**
 * Get the ISO 8601 week number
 * Based on comments from
 * http://techblog.procurios.nl/k/n618/news/view/33796/14863/Calculate-ISO-8601-week-and-year-in-javascript.html
 *
 * @param  {Object} `date`
 * @return {Number}
 */
function getWeek(date) {
  // Remove time components of date
  var targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Change date to Thursday same week
  targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

  // Take January 4th as it is always in week 1 (see ISO 8601)
  var firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

  // Change date to Thursday same week
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

  // Check if daylight-saving-time-switch occured and correct for it
  var ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
  targetThursday.setHours(targetThursday.getHours() - ds);

  // Number of weeks between target Thursday and first Thursday
  var weekDiff = (targetThursday - firstThursday) / (86400000*7);
  return 1 + Math.floor(weekDiff);
}

/**
 * Get ISO-8601 numeric representation of the day of the week
 * 1 (for Monday) through 7 (for Sunday)
 * 
 * @param  {Object} `date`
 * @return {Number}
 */
function getDayOfWeek(date) {
  var dow = date.getDay();
  if(dow === 0) {
    dow = 7;
  }
  return dow;
}

/**
 * kind-of shortcut
 * @param  {*} val
 * @return {String}
 */
function kindOf(val) {
  if (val === null) {
    return 'null';
  }

  if (val === undefined) {
    return 'undefined';
  }

  if (typeof val !== 'object') {
    return typeof val;
  }

  if (Array.isArray(val)) {
    return 'array';
  }

  return {}.toString.call(val)
    .slice(8, -1).toLowerCase();
};



  if (typeof define === 'function' && define.amd) {
    define(dateFormat);
  } else if (typeof exports === 'object') {
    module.exports = dateFormat;
  } else {
    global.dateFormat = dateFormat;
  }
})(this);

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9wZ3V0aC9naXRodWIvYm9yZ3dlYi9qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRlZm9ybWF0L2xpYi9kYXRlZm9ybWF0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7Ozs7O0FBS3RDLElBQUksR0FBRyxHQUFHO0FBQ1IsZ0JBQWMsRUFBRSxFQUFFO0FBQ2xCLG9CQUFrQixFQUFFLEVBQUU7QUFDdEIsbUJBQWlCLEVBQUUsR0FBRztBQUN0QixpQkFBZSxFQUFFLEdBQUc7Q0FDckIsQ0FBQTs7Ozs7QUFLRCxJQUFJLGVBQWUsR0FBRyxTQUFsQixlQUFlLENBQWEsUUFBUSxFQUFFO0FBQ3hDLEdBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxJQUFJLEVBQUU7QUFDMUMsUUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUE7QUFDcEMsUUFBSSxhQUFhLEVBQUUsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUEsS0FDekMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUE7QUFDbkMsWUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0dBQ3hCLENBQUMsQ0FBQTtDQUNILENBQUE7QUFDRCxJQUFJLGdCQUFnQixHQUFHLFNBQW5CLGdCQUFnQixDQUFhLFFBQVEsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFO0FBQ3ZELGlCQUFlLENBQUMsVUFBVSxVQUFVLEVBQUU7QUFDcEMsUUFBSSxVQUFVLEVBQUU7QUFDZCxPQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUE7QUFDM0QsT0FBQyxDQUFDLDZCQUE2QixDQUFDLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxD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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBkYXRlZm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpXG5cbi8qKlxuICB+fiBDb25maWcgfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5cbiovXG52YXIgY2ZnID0ge1xuICAnbG9nRmlsZXNMaXN0JzogW10sXG4gICdsb2dGaWxlc0xpc3RIVE1MJzogXCJcIixcbiAgJ2xhc3RTZWxlY3RlZExvZyc6IE5hTixcbiAgJ3BvbGxGcmVxdWVuY3knOiAxMDBcbn1cblxuLyoqXG4gIH5+IEJvcmdCYWNrdXAgaW50ZXJhY3Rpb24gfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+flxuKi9cbnZhciBub0JhY2t1cFJ1bm5pbmcgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgJC5nZXRKU09OKCcvYmFja3VwL3N0YXR1cycsIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgdmFyIGJhY2t1cFJ1bm5pbmcgPSByZXNwLnJjID09PSBudWxsXG4gICAgaWYgKGJhY2t1cFJ1bm5pbmcpIGxvZyhcIuKWtiBCYWNrdXAgaW4gcHJvZ3Jlc3NcIilcbiAgICBlbHNlIGxvZyhcIuKcliBObyBiYWNrdXAgaW4gcHJvZ3Jlc3NcIilcbiAgICBjYWxsYmFjayhiYWNrdXBSdW5uaW5nKVxuICB9KVxufVxudmFyIHBvbGxCYWNrdXBTdGF0dXMgPSBmdW5jdGlvbiAoZW5kcG9pbnQsIG1zLCBjYWxsYmFjaykge1xuICBub0JhY2t1cFJ1bm5pbmcoZnVuY3Rpb24gKG5vdFJ1bm5pbmcpIHtcbiAgICBpZiAobm90UnVubmluZykge1xuICAgICAgJCgnLm5hdmJhciBidXR0b25bdHlwZT1zdWJtaXRdJykudG9nZ2xlQ2xhc3MoJ2J0bi1zdWNjZXNzJylcbiAgICAgICQoJy5uYXZiYXIgYnV0dG9uW3R5cGU9c3VibWl0XScpLnRvZ2dsZUNsYXNzKCdidG4td2FybmluZycpXG4gICAgICAkKCcubmF2YmFyIGJ1dHRvblt0eXBlPXN1Ym1pdF0nKS50ZXh0KFwi4pa2IFN0YXJ0IEJhY2t1cFwiKVxuICAgICAgJC5nZXRKU09OKCcvbG9ncycsIHVwZGF0ZUxvZ0ZpbGVMaXN0KVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2coXCJQb2xsaW5nIGJhY2t1cCBzdGF0dXNcIilcbiAgICAgICQuZ2V0SlNPTignL2JhY2t1cC9zdGF0dXMnLCBjYWxsYmFjaylcbiAgICAgIHNldFRpbWVvdXQobXMsIHBvbGxCYWNrdXBTdGF0dXMoZW5kcG9pbnQsIG1zLCBjYWxsYmFjaykpXG4gICAgfVxuICB9KVxufVxudmFyIHN0YXJ0QmFja3VwID0gZnVuY3Rpb24gKGZvcmNlKSB7XG4gIGlmIChmb3JjZSkge1xuICAgIGxvZyhcIlNlbmRpbmcgYmFja3VwIHN0YXJ0IHJlcXVlc3RcIilcbiAgICAkLnBvc3QoJy9iYWNrdXAvc3RhcnQnLCB7fSwgZnVuY3Rpb24gKCkge1xuICAgICAgJCgnLm5hdmJhciBidXR0b25bdHlwZT1zdWJtaXRdJykudG9nZ2xlQ2xhc3MoJ2J0bi1zdWNjZXNzJylcbiAgICAgICQoJy5uYXZiYXIgYnV0dG9uW3R5cGU9c3VibWl0XScpLnRvZ2dsZUNsYXNzKCdidG4td2FybmluZycpXG4gICAgICAkKCcubmF2YmFyIGJ1dHRvblt0eXBlPXN1Ym1pdF0nKS50ZXh0KFwi4pyWIFN0b3AgQmFja3VwXCIpXG4gICAgICBwb2xsQmFja3VwU3RhdHVzKCcvYmFja3VwL3N0YXR1cycsIGNmZ1sncG9sbEZyZXF1ZW5jeSddLFxuICAgICAgICBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgbG9nKFwiUmVjZWl2ZWQgc3RhdHVzIHVwZGF0ZVwiKVxuICAgICAgICB9KSB9KVxuICB9IGVsc2UgaWYgKGZvcmNlID09PSB1bmRlZmluZWQpIG5vQmFja3VwUnVubmluZyhzdGFydEJhY2t1cClcbiAgZWxzZSBsb2coXCIqTm90KiBzZW5kaW5nIGJhY2t1cCBzdGFydCByZXF1ZXN0XCIpXG59XG5cbi8qKlxuICB+fiBVdGlsaXR5IH5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5cbiovXG52YXIgbG9nID0gZnVuY3Rpb24oKXtcbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gIHZhciB0aW1lID0gJ1snICsgZGF0ZWZvcm1hdChuZXcgRGF0ZSgpLCAnSEg6TU06c3MnKSArICddJ1xuICBhcmdzLnVuc2hpZnQodGltZSlcbiAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gIHJldHVybiB0aGlzXG59XG52YXIgaXNJbnQgPSBmdW5jdGlvbiAobikge1xuICByZXR1cm4gbiAlIDEgPT09IDBcbn1cbnZhciBzdWNjZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgbG9nRmlsZXMgPSBkYXRhLmxvZ19maWxlc1xufVxudmFyIHBhcnNlQW5jaG9yID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYudG9TdHJpbmcoKVxuICB2YXIgaWR4ID0gdXJsLmluZGV4T2YoXCIjXCIpXG4gIHZhciBhbmNob3IgPSAoaWR4ICE9IC0xKSA/IHVybC5zdWJzdHJpbmcoaWR4KzEpIDogXCJcIlxuICBpZiAoYW5jaG9yKSB7XG4gICAgdmFyIHBhcnRzID0gYW5jaG9yLnNwbGl0KCc7JylcbiAgICB2YXIgcGFydHNQYXJzZWQgPSB7fVxuICAgIHBhcnRzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBwYWlyID0gZS5zcGxpdCgnOicpXG4gICAgICBwYXJ0c1BhcnNlZFtwYWlyWzBdXSA9IHBhaXJbMV1cbiAgICB9KVxuICAgIHJldHVybiBwYXJ0c1BhcnNlZFxuICB9IGVsc2UgcmV0dXJuIHsnbG9nJzogMH1cbn1cblxuLyoqXG4gIH5+IFVJIHVwZGF0ZXJzIH5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+flxuKi9cbnZhciB1cGRhdGVMb2dGaWxlTGlzdCA9IGZ1bmN0aW9uIChsb2dGaWxlcykge1xuICBsb2coXCJVcGRhdGluZyBsb2cgZmlsZSBsaXN0XCIpXG4gIGNmZy5sb2dGaWxlc0xpc3RIVE1MID0gW11cbiAgJC5lYWNoKGxvZ0ZpbGVzLmxvZ19maWxlcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICBjZmcubG9nRmlsZXNMaXN0SFRNTCArPSAnPGxpPjxhIGhyZWY9XCIjbG9nOicgKyB2YWx1ZVswXVxuICAgICAgKyAnXCIgb25DbGljaz1cIndpbmRvdy5kaXNwbGF5VGhhdExvZygnXG4gICAgICArIHZhbHVlWzBdICsgJylcIj4nICsgdmFsdWVbMV0gKyAnPC9hPjwvbGk+J30pXG4gICQoJyNsb2ctZmlsZXMnKS5odG1sKGNmZy5sb2dGaWxlc0xpc3RIVE1MKVxufVxudmFyIHJlbmRlckxvZ0ZpbGUgPSBmdW5jdGlvbiAodGV4dCkge1xuICBsb2coXCJSZW5kZXJpbmc6IFwiICsgdGV4dC5sb2dfZmlsZSlcbiAgJCgnI2xvZy10ZXh0JykuaHRtbCh0ZXh0LmxvZ19jb250ZW50KVxufVxudmFyIHVwZGF0ZVNob3duTG9nRmlsZSA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gIGxvZyhcIlVwZGF0aW5nIGxvZyBmaWxlIGxpc3RcIilcbiAgdmFyIGxvZ051bWJlciA9IE5hTlxuICBpZiAoIWlzSW50KHRoYXQpKSB7XG4gICAgdmFyIGFuY2hvciA9IHBhcnNlQW5jaG9yKClcbiAgICBsb2dOdW1iZXIgPSBhbmNob3JbJ2xvZyddXG4gIH0gZWxzZSBsb2dOdW1iZXIgPSB0aGF0XG4gIFxuICB2YXIgdXJsID0gJy9sb2dzLycgKyBsb2dOdW1iZXIgKyAnLzA6OidcbiAgbG9nKFwiRmV0Y2hpbmcgXCIgKyB1cmwpXG4gICQuZ2V0SlNPTih1cmwsIHJlbmRlckxvZ0ZpbGUpXG59XG5cbi8qKlxuICB+fiBVSSBjYWxsYWJsZXMgfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5cbiovXG53aW5kb3cuZGlzcGxheVRoYXRMb2cgPSBmdW5jdGlvbiAodGhhdCkge1xuICB1cGRhdGVTaG93bkxvZ0ZpbGUodGhhdClcbn1cbndpbmRvdy5zdGFydEJhY2t1cCA9IHN0YXJ0QmFja3VwXG5cbi8qKlxuICB+fiBTaXRlIGluaXQgfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5cbiovXG4kLmdldEpTT04oJy9sb2dzJywgdXBkYXRlTG9nRmlsZUxpc3QpXG51cGRhdGVTaG93bkxvZ0ZpbGUoKVxuXG5cblxuXG5cblxuIiwiLypcbiAqIERhdGUgRm9ybWF0IDEuMi4zXG4gKiAoYykgMjAwNy0yMDA5IFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPlxuICogTUlUIGxpY2Vuc2VcbiAqXG4gKiBJbmNsdWRlcyBlbmhhbmNlbWVudHMgYnkgU2NvdHQgVHJlbmRhIDxzY290dC50cmVuZGEubmV0PlxuICogYW5kIEtyaXMgS293YWwgPGNpeGFyLmNvbS9+a3Jpcy5rb3dhbC8+XG4gKlxuICogQWNjZXB0cyBhIGRhdGUsIGEgbWFzaywgb3IgYSBkYXRlIGFuZCBhIG1hc2suXG4gKiBSZXR1cm5zIGEgZm9ybWF0dGVkIHZlcnNpb24gb2YgdGhlIGdpdmVuIGRhdGUuXG4gKiBUaGUgZGF0ZSBkZWZhdWx0cyB0byB0aGUgY3VycmVudCBkYXRlL3RpbWUuXG4gKiBUaGUgbWFzayBkZWZhdWx0cyB0byBkYXRlRm9ybWF0Lm1hc2tzLmRlZmF1bHQuXG4gKi9cblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGRhdGVGb3JtYXQgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdG9rZW4gPSAvZHsxLDR9fG17MSw0fXx5eSg/Onl5KT98KFtIaE1zVHRdKVxcMT98W0xsb1NaV05dfCdbXiddKid8J1teJ10qJy9nO1xuICAgICAgdmFyIHRpbWV6b25lID0gL1xcYig/OltQTUNFQV1bU0RQXVR8KD86UGFjaWZpY3xNb3VudGFpbnxDZW50cmFsfEVhc3Rlcm58QXRsYW50aWMpICg/OlN0YW5kYXJkfERheWxpZ2h0fFByZXZhaWxpbmcpIFRpbWV8KD86R01UfFVUQykoPzpbLStdXFxkezR9KT8pXFxiL2c7XG4gICAgICB2YXIgdGltZXpvbmVDbGlwID0gL1teLStcXGRBLVpdL2c7XG4gIFxuICAgICAgLy8gUmVnZXhlcyBhbmQgc3VwcG9ydGluZyBmdW5jdGlvbnMgYXJlIGNhY2hlZCB0aHJvdWdoIGNsb3N1cmVcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZGF0ZSwgbWFzaywgdXRjLCBnbXQpIHtcbiAgXG4gICAgICAgIC8vIFlvdSBjYW4ndCBwcm92aWRlIHV0YyBpZiB5b3Ugc2tpcCBvdGhlciBhcmdzICh1c2UgdGhlICdVVEM6JyBtYXNrIHByZWZpeClcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYga2luZE9mKGRhdGUpID09PSAnc3RyaW5nJyAmJiAhL1xcZC8udGVzdChkYXRlKSkge1xuICAgICAgICAgIG1hc2sgPSBkYXRlO1xuICAgICAgICAgIGRhdGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGRhdGUgPSBkYXRlIHx8IG5ldyBEYXRlO1xuICBcbiAgICAgICAgaWYoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgICBkYXRlID0gbmV3IERhdGUoZGF0ZSk7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGlmIChpc05hTihkYXRlKSkge1xuICAgICAgICAgIHRocm93IFR5cGVFcnJvcignSW52YWxpZCBkYXRlJyk7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIG1hc2sgPSBTdHJpbmcoZGF0ZUZvcm1hdC5tYXNrc1ttYXNrXSB8fCBtYXNrIHx8IGRhdGVGb3JtYXQubWFza3NbJ2RlZmF1bHQnXSk7XG4gIFxuICAgICAgICAvLyBBbGxvdyBzZXR0aW5nIHRoZSB1dGMvZ210IGFyZ3VtZW50IHZpYSB0aGUgbWFza1xuICAgICAgICB2YXIgbWFza1NsaWNlID0gbWFzay5zbGljZSgwLCA0KTtcbiAgICAgICAgaWYgKG1hc2tTbGljZSA9PT0gJ1VUQzonIHx8IG1hc2tTbGljZSA9PT0gJ0dNVDonKSB7XG4gICAgICAgICAgbWFzayA9IG1hc2suc2xpY2UoNCk7XG4gICAgICAgICAgdXRjID0gdHJ1ZTtcbiAgICAgICAgICBpZiAobWFza1NsaWNlID09PSAnR01UOicpIHtcbiAgICAgICAgICAgIGdtdCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gIFxuICAgICAgICB2YXIgXyA9IHV0YyA/ICdnZXRVVEMnIDogJ2dldCc7XG4gICAgICAgIHZhciBkID0gZGF0ZVtfICsgJ0RhdGUnXSgpO1xuICAgICAgICB2YXIgRCA9IGRhdGVbXyArICdEYXknXSgpO1xuICAgICAgICB2YXIgbSA9IGRhdGVbXyArICdNb250aCddKCk7XG4gICAgICAgIHZhciB5ID0gZGF0ZVtfICsgJ0Z1bGxZZWFyJ10oKTtcbiAgICAgICAgdmFyIEggPSBkYXRlW18gKyAnSG91cnMnXSgpO1xuICAgICAgICB2YXIgTSA9IGRhdGVbXyArICdNaW51dGVzJ10oKTtcbiAgICAgICAgdmFyIHMgPSBkYXRlW18gKyAnU2Vjb25kcyddKCk7XG4gICAgICAgIHZhciBMID0gZGF0ZVtfICsgJ01pbGxpc2Vjb25kcyddKCk7XG4gICAgICAgIHZhciBvID0gdXRjID8gMCA6IGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgICAgICAgdmFyIFcgPSBnZXRXZWVrKGRhdGUpO1xuICAgICAgICB2YXIgTiA9IGdldERheU9mV2VlayhkYXRlKTtcbiAgICAgICAgdmFyIGZsYWdzID0ge1xuICAgICAgICAgIGQ6ICAgIGQsXG4gICAgICAgICAgZGQ6ICAgcGFkKGQpLFxuICAgICAgICAgIGRkZDogIGRhdGVGb3JtYXQuaTE4bi5kYXlOYW1lc1tEXSxcbiAgICAgICAgICBkZGRkOiBkYXRlRm9ybWF0LmkxOG4uZGF5TmFtZXNbRCArIDddLFxuICAgICAgICAgIG06ICAgIG0gKyAxLFxuICAgICAgICAgIG1tOiAgIHBhZChtICsgMSksXG4gICAgICAgICAgbW1tOiAgZGF0ZUZvcm1hdC5pMThuLm1vbnRoTmFtZXNbbV0sXG4gICAgICAgICAgbW1tbTogZGF0ZUZvcm1hdC5pMThuLm1vbnRoTmFtZXNbbSArIDEyXSxcbiAgICAgICAgICB5eTogICBTdHJpbmcoeSkuc2xpY2UoMiksXG4gICAgICAgICAgeXl5eTogeSxcbiAgICAgICAgICBoOiAgICBIICUgMTIgfHwgMTIsXG4gICAgICAgICAgaGg6ICAgcGFkKEggJSAxMiB8fCAxMiksXG4gICAgICAgICAgSDogICAgSCxcbiAgICAgICAgICBISDogICBwYWQoSCksXG4gICAgICAgICAgTTogICAgTSxcbiAgICAgICAgICBNTTogICBwYWQoTSksXG4gICAgICAgICAgczogICAgcyxcbiAgICAgICAgICBzczogICBwYWQocyksXG4gICAgICAgICAgbDogICAgcGFkKEwsIDMpLFxuICAgICAgICAgIEw6ICAgIHBhZChNYXRoLnJvdW5kKEwgLyAxMCkpLFxuICAgICAgICAgIHQ6ICAgIEggPCAxMiA/ICdhJyAgOiAncCcsXG4gICAgICAgICAgdHQ6ICAgSCA8IDEyID8gJ2FtJyA6ICdwbScsXG4gICAgICAgICAgVDogICAgSCA8IDEyID8gJ0EnICA6ICdQJyxcbiAgICAgICAgICBUVDogICBIIDwgMTIgPyAnQU0nIDogJ1BNJyxcbiAgICAgICAgICBaOiAgICBnbXQgPyAnR01UJyA6IHV0YyA/ICdVVEMnIDogKFN0cmluZyhkYXRlKS5tYXRjaCh0aW1lem9uZSkgfHwgWycnXSkucG9wKCkucmVwbGFjZSh0aW1lem9uZUNsaXAsICcnKSxcbiAgICAgICAgICBvOiAgICAobyA+IDAgPyAnLScgOiAnKycpICsgcGFkKE1hdGguZmxvb3IoTWF0aC5hYnMobykgLyA2MCkgKiAxMDAgKyBNYXRoLmFicyhvKSAlIDYwLCA0KSxcbiAgICAgICAgICBTOiAgICBbJ3RoJywgJ3N0JywgJ25kJywgJ3JkJ11bZCAlIDEwID4gMyA/IDAgOiAoZCAlIDEwMCAtIGQgJSAxMCAhPSAxMCkgKiBkICUgMTBdLFxuICAgICAgICAgIFc6ICAgIFcsXG4gICAgICAgICAgTjogICAgTlxuICAgICAgICB9O1xuICBcbiAgICAgICAgcmV0dXJuIG1hc2sucmVwbGFjZSh0b2tlbiwgZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICAgICAgaWYgKG1hdGNoIGluIGZsYWdzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhZ3NbbWF0Y2hdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbWF0Y2guc2xpY2UoMSwgbWF0Y2gubGVuZ3RoIC0gMSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9KSgpO1xuXG4gIGRhdGVGb3JtYXQubWFza3MgPSB7XG4gICAgJ2RlZmF1bHQnOiAgICAgICAgICAgICAgICdkZGQgbW1tIGRkIHl5eXkgSEg6TU06c3MnLFxuICAgICdzaG9ydERhdGUnOiAgICAgICAgICAgICAnbS9kL3l5JyxcbiAgICAnbWVkaXVtRGF0ZSc6ICAgICAgICAgICAgJ21tbSBkLCB5eXl5JyxcbiAgICAnbG9uZ0RhdGUnOiAgICAgICAgICAgICAgJ21tbW0gZCwgeXl5eScsXG4gICAgJ2Z1bGxEYXRlJzogICAgICAgICAgICAgICdkZGRkLCBtbW1tIGQsIHl5eXknLFxuICAgICdzaG9ydFRpbWUnOiAgICAgICAgICAgICAnaDpNTSBUVCcsXG4gICAgJ21lZGl1bVRpbWUnOiAgICAgICAgICAgICdoOk1NOnNzIFRUJyxcbiAgICAnbG9uZ1RpbWUnOiAgICAgICAgICAgICAgJ2g6TU06c3MgVFQgWicsXG4gICAgJ2lzb0RhdGUnOiAgICAgICAgICAgICAgICd5eXl5LW1tLWRkJyxcbiAgICAnaXNvVGltZSc6ICAgICAgICAgICAgICAgJ0hIOk1NOnNzJyxcbiAgICAnaXNvRGF0ZVRpbWUnOiAgICAgICAgICAgJ3l5eXktbW0tZGRcXCdUXFwnSEg6TU06c3NvJyxcbiAgICAnaXNvVXRjRGF0ZVRpbWUnOiAgICAgICAgJ1VUQzp5eXl5LW1tLWRkXFwnVFxcJ0hIOk1NOnNzXFwnWlxcJycsXG4gICAgJ2V4cGlyZXNIZWFkZXJGb3JtYXQnOiAgICdkZGQsIGRkIG1tbSB5eXl5IEhIOk1NOnNzIFonXG4gIH07XG5cbiAgLy8gSW50ZXJuYXRpb25hbGl6YXRpb24gc3RyaW5nc1xuICBkYXRlRm9ybWF0LmkxOG4gPSB7XG4gICAgZGF5TmFtZXM6IFtcbiAgICAgICdTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnLFxuICAgICAgJ1N1bmRheScsICdNb25kYXknLCAnVHVlc2RheScsICdXZWRuZXNkYXknLCAnVGh1cnNkYXknLCAnRnJpZGF5JywgJ1NhdHVyZGF5J1xuICAgIF0sXG4gICAgbW9udGhOYW1lczogW1xuICAgICAgJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJyxcbiAgICAgICdKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ1xuICAgIF1cbiAgfTtcblxuZnVuY3Rpb24gcGFkKHZhbCwgbGVuKSB7XG4gIHZhbCA9IFN0cmluZyh2YWwpO1xuICBsZW4gPSBsZW4gfHwgMjtcbiAgd2hpbGUgKHZhbC5sZW5ndGggPCBsZW4pIHtcbiAgICB2YWwgPSAnMCcgKyB2YWw7XG4gIH1cbiAgcmV0dXJuIHZhbDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIElTTyA4NjAxIHdlZWsgbnVtYmVyXG4gKiBCYXNlZCBvbiBjb21tZW50cyBmcm9tXG4gKiBodHRwOi8vdGVjaGJsb2cucHJvY3VyaW9zLm5sL2svbjYxOC9uZXdzL3ZpZXcvMzM3OTYvMTQ4NjMvQ2FsY3VsYXRlLUlTTy04NjAxLXdlZWstYW5kLXllYXItaW4tamF2YXNjcmlwdC5odG1sXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBgZGF0ZWBcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuZnVuY3Rpb24gZ2V0V2VlayhkYXRlKSB7XG4gIC8vIFJlbW92ZSB0aW1lIGNvbXBvbmVudHMgb2YgZGF0ZVxuICB2YXIgdGFyZ2V0VGh1cnNkYXkgPSBuZXcgRGF0ZShkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgZGF0ZS5nZXREYXRlKCkpO1xuXG4gIC8vIENoYW5nZSBkYXRlIHRvIFRodXJzZGF5IHNhbWUgd2Vla1xuICB0YXJnZXRUaHVyc2RheS5zZXREYXRlKHRhcmdldFRodXJzZGF5LmdldERhdGUoKSAtICgodGFyZ2V0VGh1cnNkYXkuZ2V0RGF5KCkgKyA2KSAlIDcpICsgMyk7XG5cbiAgLy8gVGFrZSBKYW51YXJ5IDR0aCBhcyBpdCBpcyBhbHdheXMgaW4gd2VlayAxIChzZWUgSVNPIDg2MDEpXG4gIHZhciBmaXJzdFRodXJzZGF5ID0gbmV3IERhdGUodGFyZ2V0VGh1cnNkYXkuZ2V0RnVsbFllYXIoKSwgMCwgNCk7XG5cbiAgLy8gQ2hhbmdlIGRhdGUgdG8gVGh1cnNkYXkgc2FtZSB3ZWVrXG4gIGZpcnN0VGh1cnNkYXkuc2V0RGF0ZShmaXJzdFRodXJzZGF5LmdldERhdGUoKSAtICgoZmlyc3RUaHVyc2RheS5nZXREYXkoKSArIDYpICUgNykgKyAzKTtcblxuICAvLyBDaGVjayBpZiBkYXlsaWdodC1zYXZpbmctdGltZS1zd2l0Y2ggb2NjdXJlZCBhbmQgY29ycmVjdCBmb3IgaXRcbiAgdmFyIGRzID0gdGFyZ2V0VGh1cnNkYXkuZ2V0VGltZXpvbmVPZmZzZXQoKSAtIGZpcnN0VGh1cnNkYXkuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgdGFyZ2V0VGh1cnNkYXkuc2V0SG91cnModGFyZ2V0VGh1cnNkYXkuZ2V0SG91cnMoKSAtIGRzKTtcblxuICAvLyBOdW1iZXIgb2Ygd2Vla3MgYmV0d2VlbiB0YXJnZXQgVGh1cnNkYXkgYW5kIGZpcnN0IFRodXJzZGF5XG4gIHZhciB3ZWVrRGlmZiA9ICh0YXJnZXRUaHVyc2RheSAtIGZpcnN0VGh1cnNkYXkpIC8gKDg2NDAwMDAwKjcpO1xuICByZXR1cm4gMSArIE1hdGguZmxvb3Iod2Vla0RpZmYpO1xufVxuXG4vKipcbiAqIEdldCBJU08tODYwMSBudW1lcmljIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBkYXkgb2YgdGhlIHdlZWtcbiAqIDEgKGZvciBNb25kYXkpIHRocm91Z2ggNyAoZm9yIFN1bmRheSlcbiAqIFxuICogQHBhcmFtICB7T2JqZWN0fSBgZGF0ZWBcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuZnVuY3Rpb24gZ2V0RGF5T2ZXZWVrKGRhdGUpIHtcbiAgdmFyIGRvdyA9IGRhdGUuZ2V0RGF5KCk7XG4gIGlmKGRvdyA9PT0gMCkge1xuICAgIGRvdyA9IDc7XG4gIH1cbiAgcmV0dXJuIGRvdztcbn1cblxuLyoqXG4gKiBraW5kLW9mIHNob3J0Y3V0XG4gKiBAcGFyYW0gIHsqfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24ga2luZE9mKHZhbCkge1xuICBpZiAodmFsID09PSBudWxsKSB7XG4gICAgcmV0dXJuICdudWxsJztcbiAgfVxuXG4gIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAndW5kZWZpbmVkJztcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB0eXBlb2YgdmFsO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgIHJldHVybiAnYXJyYXknO1xuICB9XG5cbiAgcmV0dXJuIHt9LnRvU3RyaW5nLmNhbGwodmFsKVxuICAgIC5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKTtcbn07XG5cblxuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZGF0ZUZvcm1hdCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkYXRlRm9ybWF0O1xuICB9IGVsc2Uge1xuICAgIGdsb2JhbC5kYXRlRm9ybWF0ID0gZGF0ZUZvcm1hdDtcbiAgfVxufSkodGhpcyk7XG4iXX0=
