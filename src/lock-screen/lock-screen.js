const lockScreenService = ($rootScope) => {
  return {
    show(settings) {
      $rootScope.$broadcast('ionic-lock-screen:show', {
        touchId           : settings.touchId || false,
        ACButton          : settings.ACButton || false,
        DelButton         : settings.DelButton || false,
        passcode          : settings.code,
        onCorrect         : settings.onCorrect || null,
        onWrong           : settings.onWrong || null,
        passcodeLabel     : settings.passcodeLabel || 'Enter Passcode',
        touchLabel        : settings.touchLabel,
        backgroundColor   : settings.backgroundColor || '#F1F1F1',
        textColor         : settings.textColor || '#464646',
        buttonColor       : settings.buttonColor || '#F8F8F8',
        buttonTextColor   : settings.buttonTextColor || '#464646',
        buttonPressed     : settings.buttonPressed || '#E0E0E0',
        buttonACColor     : settings.buttonACColor || '#F8F8F8',
        buttonACTextColor : settings.buttonACTextColor || '#464646',
        buttonDelColor    : settings.buttonDelColor || '#F8F8F8',
        buttonDelTextColor: settings.buttonDelTextColor || '#464646',
        logoUrl           : settings.logoUrl,
        maxPasscodeAttemps: settings.maxPasscodeAttemps || 3,
      });
    },
  };
};

const lockScreenDirective = ($timeout, sha256) => {
  return {
    restrict: 'E',
    scope : {},
    link (scope) {
      let passcodeAttempts = 0;
      scope.enteredPasscode = '';
      scope.$on('ionic-lock-screen:show', (e, data) => {
        scope._showLockScreen   = true;
        scope.ACButton          = data.ACButton;
        scope.DelButton         = data.DelButton;
        scope.passcode          = data.passcode;
        scope.onCorrect         = data.onCorrect;
        scope.onWrong           = data.onWrong;
        scope.passcodeLabel     = data.passcodeLabel;
        scope.touchLabel        = data.touchLabel;
        scope.backgroundColor   = data.backgroundColor;
        scope.textColor         = data.textColor;
        scope.buttonColor       = data.buttonColor;
        scope.buttonTextColor   = data.buttonTextColor;
        scope.buttonPressed     = data.buttonPressed;
        scope.buttonACColor     = data.buttonACColor;
        scope.buttonACTextColor = data.buttonACTextColor;
        scope.buttonDelColor    = data.buttonDelColor;
        scope.buttonDelTextColor= data.buttonDelTextColor;
        scope.logoUrl           = data.logoUrl;
        scope.maxPasscodeAttemps= data.maxPasscodeAttemps;
        $timeout(() => {
          if (data.touchId && window.touchid) {
            window.touchid.checkSupport(() => {
              window.touchid.authenticate(() => {
                // success
                scope.$apply(() => {
                  scope._showLockScreen = false;
                });
                scope.onCorrect && scope.onCorrect();
              }, () => {
                // failure
              }, scope.touchLabel);
            }, () => {
              console.info('touch id is not supported on your device');
            });
          }
        }, 50);
      });
      scope.all_clear = () => {
        scope.enteredPasscode = '';
      };
      scope.delete = () => {
        scope.enteredPasscode = scope.enteredPasscode.slice(0,-1);
      };
      scope.digit = (digit) => {
        scope.selected = +digit;
        if (scope.passcodeWrong) {
          return;
        }
        scope.enteredPasscode += '' + digit;
        if (scope.enteredPasscode.length >= 4) {
          if (scope.passcode === '****'){
            // Special mode where we allow SETTING the passcode
            var enteredPasscode = scope.enteredPasscode;
            scope.enteredPasscode = '';
            passcodeAttempts = 0;
            scope.onCorrect && scope.onCorrect(enteredPasscode);
            scope._showLockScreen = false;
          } else if (sha256(scope.enteredPasscode) === scope.passcode) {
            scope.enteredPasscode = '';
            passcodeAttempts = 0;
            scope.onCorrect && scope.onCorrect();
            scope._showLockScreen = false;
          } else {
            scope.passcodeWrong = true;
            passcodeAttempts++;
            scope.onWrong && scope.onWrong(passcodeAttempts);
            if(passcodeAttempts >= scope.maxPasscodeAttemps) {
              scope._showLockScreen = false;
            }
            $timeout(() => {
              scope.enteredPasscode = '';
              scope.passcodeWrong = false;
            }, 600);
          }
        }
      };
    },
    template: `
      <style>
          /* Animations*/
          @keyframes ILS_shake {
            from, to {
              transform: translate3d(0, 0, 0);
            }
            10%, 30%, 50%, 70%, 90% {
              transform: translate3d(-10px, 0, 0);
            }
            20%, 40%, 60%, 80% {
              transform: translate3d(10px, 0, 0);
            }
          }
          @keyframes ILS_buttonPress {
            0% {
              background-color: {{buttonPressed}};
            }
            100% {
              background-color: {{buttonColor}};
            }
          }
          /* Lock Screen Layout*/
          .ILS_lock {
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 999;
            padding-top: 20px; /* status bar */
            background-color: {{backgroundColor}};
          }
          .ILS_lock-hidden {
            display: none;
          }
          .ILS_label-row {
            height: 50px;
            width: 100%;
            text-align: center;
            font-size: 23px;
            padding-top: 10px;
            color: {{textColor}};
          }
          .ILS_circles-row {
            display: flex;
            flex-direction: row;
            justify-content: center;
            width: 100%;
            height: 60px;
          }
          .ILS_circle {
            background-color: {{backgroundColor}};
            border-radius: 50%;
            width: 10px;
            height: 10px;
            border:solid 1px {{textColor}};
            margin: 0 15px;
          }
          .ILS_numbers-row {
            display: flex;
            flex-direction: row;
            justify-content: center;
            width: 100%;
            height: 100px;
          }
          .ILS_digit {
            margin: 0 14px;
            width: 80px;
            border-radius: 99%;
            border: 1px solid {{buttonTextColor}};
            height: 80px;
            text-align: center;
            padding-top: 29px;
            font-size: 21px;
            color: {{buttonTextColor}};
            background-color: {{buttonColor}};
          }
          .ILS_digit_hiden {
            margin: 0 14px;
            width: 80px;
            height: 80px;
          }
          .ILS_digit.activated {
            -webkit-animation-name: ILS_buttonPress;
            animation-name: ILS_buttonPress;
            -webkit-animation-duration: 0.3;
            animation-duration: 0.3s;
          }
          .ILS_ac {
            color: {{buttonACTextColor}};
            background-color: {{buttonACColor}};
            }
          .ILS_del {
            color: {{buttonDelTextColor}};
            font-size: 30px;
            background-color: {{buttonDelColor}};
            border: none;
            padding-top: 24px;
            }
          .ILS_full {
            background-color:{{textColor}};
          }
          .ILS_logo {
            height: 70px;
            width: 100%;
            text-align: center;
          }
          .ILS_logo img {
            max-height: 50px;
          }
          .ILS_shake {
            -webkit-animation-name: ILS_shake;
            animation-name: ILS_shake;
            -webkit-animation-duration: 0.5;
            animation-duration: 0.5s;
            -webkit-animation-fill-mode: both;
            animation-fill-mode: both;
          }
          @media screen and (max-device-height: 568px) {
            .ILS_digit {
              width: 70px;
              height: 70px;
              padding-top: 24px;
            }
            .ILS_numbers-row {
              height: 90px;
            }
            .ILS_circles-row {
              height: 40px;
            }
            .ILS_logo {
              height: 60px;
            }
          }
          @media screen and (max-device-height: 480px) {
            .ILS_logo {
              display: none;
              height: 0px;
            }
          }
      </style>
      <div class="ILS_lock" ng-class="!_showLockScreen ?  'ILS_lock-hidden' : ''">
        <div class="ILS_logo">
          <img ng-src="{{logoUrl}}" />
        </div>
        <div class="ILS_label-row">
          {{passcodeLabel}}
        </div>
        <div class="ILS_circles-row" ng-class="passcodeWrong ?  'ILS_shake' : ''">
          <div class="ILS_circle" ng-class=" enteredPasscode.length>0 ? 'ILS_full' : ''"></div>
          <div class="ILS_circle" ng-class=" enteredPasscode.length>1 ? 'ILS_full' : ''"></div>
          <div class="ILS_circle" ng-class=" enteredPasscode.length>2 ? 'ILS_full' : ''"></div>
          <div class="ILS_circle" ng-class=" enteredPasscode.length>3 ? 'ILS_full' : ''"></div>
        </div>
        <div class="ILS_numbers-row">
          <div ng-click="digit(1)" class="ILS_digit">1</div>
          <div ng-click="digit(2)" class="ILS_digit">2</div>
          <div ng-click="digit(3)" class="ILS_digit">3</div>
        </div>
        <div class="ILS_numbers-row">
          <div ng-click="digit(4)" class="ILS_digit">4</div>
          <div ng-click="digit(5)" class="ILS_digit">5</div>
          <div ng-click="digit(6)" class="ILS_digit">6</div>
        </div>
        <div class="ILS_numbers-row">
          <div ng-click="digit(7)" class="ILS_digit">7</div>
          <div ng-click="digit(8)" class="ILS_digit">8</div>
          <div ng-click="digit(9)" class="ILS_digit">9</div>
        </div>
        <div class="ILS_numbers-row">
          <div ng-show="!ACButton" class="ILS_digit_hiden"></div>
          <div ng-show="ACButton" ng-click="all_clear()" class="ILS_digit ILS_ac">AC</div>
          <div ng-click="digit(0)" class="ILS_digit">0</div>
          <div ng-show="!DelButton" class="ILS_digit_hiden"></div>
          <div ng-show="DelButton" ng-click="delete()" class="ILS_digit ILS_del"><i class="icon ion-backspace"></i></div>
        </div>
      </div>
    `,
  };
};

angular.module('sha256', []).constant('sha256', window.sha256);
angular.module('ionic-lock-screen', ['sha256']);
angular.module('ionic-lock-screen').directive('lockScreen', lockScreenDirective);
angular.module('ionic-lock-screen').service('$lockScreen', lockScreenService);
