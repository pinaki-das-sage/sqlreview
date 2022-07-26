/**
 * @author Pinaki Das <pinaki.das@sage.com>
 * @copyright 2022 Intacct Corporation All, Rights Reserved
 */

'use strict'

class ValidationManager {
    constructor() {
        this.queries = [];
    }

    /**
     * validate the given data according to set rules
     */
    validate($sqlText) {
        let $this = this;
        if($sqlText === "") {
            notificationManager.showError("Abe kuchh text to daal le..");
            return false;
        }
        $this.showLoading();
        $this.clearOutput();
        $this.initQueries($sqlText);
        $this.validateQueries();
        $this.hideLoading();
    }

    /**
     * split the sql text into separate queries, the separator would be /
     * remove any blanks
     * @param string $sqlText
     */
    initQueries($sqlText) {
        this.ruleManager = new RuleManager($sqlText);
        let $queries = $sqlText.split("/").filter(element => $.trim(element));
        this.queries = $queries;
    }

    validateQueries() {
        for(let i=0; i<this.queries.length; i++) {
            let $query = new Query(this.queries[i]);
            let $queryResult = this.validateQuery($query);

            if($queryResult['errors'].length > 0) {
                for(let j=0; j<$queryResult['errors'].length; j++) {
                    if($queryResult['errors'][j]['type'] === 'WARNING') {
                        notificationManager.showInfo($queryResult['errors'][j]['message']);
                    } else {
                        notificationManager.showError($queryResult['errors'][j]['message']);
                    }
                }
            } else {
                notificationManager.showSuccess($queryResult['success']['message']);
            }
            notificationManager.show("-----------------------------------------------------");
        }
    }

    /**
     * validate a given query by running different rules on it
     * @param string $query
     */
    validateQuery($query) {
        return this.ruleManager.runAllRules($query);
    }

    /**
     * clear the output area
     */
    clearOutput() {
        $('#validationOutput').empty();
    }

    /**
     * show the loading shim
     */
    showLoading() {
        $('#loading').show();
    }

    /**
     * hide the loader
     */
    hideLoading() {
        $('#loading').hide();
    }
};

const validationManager = new ValidationManager();

