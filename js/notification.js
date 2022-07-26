/**
 * @author Pinaki Das <pinaki.das@sage.com>
 * @copyright 2022 Intacct Corporation All, Rights Reserved
 */

'use strict'

class NotificationManager {
    show($message, $params={}) {
        let themeColor = 'success';
        if(typeof $params !== 'undefined' && typeof $params.theme !== 'undefined') {
            themeColor = $params.theme;
        }
        let $encodedMessage = $('<div>').text($message).html();
        $('#validationOutput').append(`<p class="text-${themeColor}">${$encodedMessage}</p>`);
    }

    showError($message) {
        this.show($message, {"theme": "danger"});
    }

    showInfo($message) {
        this.show($message, {"theme": "info"});
    }

    showSuccess($message) {
        this.show($message, {"theme": "success"});
    }
}

const notificationManager = new NotificationManager();
