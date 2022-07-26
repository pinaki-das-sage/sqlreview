/**
 * @author Pinaki Das <pinaki.das@sage.com>
 * @copyright 2022 Intacct Corporation All, Rights Reserved
 */

'use strict'

class RuleManager {
    constructor($allQueries) {
        this.rulesToRun = [
            {
                "name": "createTableHasValidTablespace",
                "error": "The tablespace is invalid.",
                "success": "The tablespace is valid for all the create table statements.",
            },
            {
                "name": "createIndexHasValidTablespace",
                "error": "The tablespace is invalid.",
                "success": "The tablespace is valid for all the create index statement.",
            },
            {
                "name": "hasValidTempTableName",
                "error": "Table name must contain a temp_ prefix for temp tables",
                "success": "All the temp table names are correct.",
            },
            {
                "name": "hasDoubleQuotes",
                "error": "Double quotes should be avoided in the query.",
                "success": "No double-quotes found in the query.",
                "type": "WARNING",
            },
            {
                "name": "hasValidContraintNames",
                "error": "Invalid constraint name, please refer documentation for valid constraint names.",
                "success": "All constraint names are correct.",
            },
        ];
        this.allQueries = new Query($allQueries);                   //we keep this in case we need to validate using another statement
        this.currentRule = {};                  //this is the current rule that is being run
    }

    /**
     * return the rules to run
     */
    getRulesToRun() {
        return this.rulesToRun;
    }

    /**
     * validate the given data according to set rules
     * @param string ruleName
     * @param string data
     */
    runRule(ruleName, $data) {
        let $rule = this.getRulesToRun().find(rule => rule.name === ruleName);
        if(typeof $rule === 'undefined' || typeof this[ruleName] === 'undefined') {
            throw `There is some issue with the configuration of rule: ${ruleName}. Please check with your administrator.`;
        }

        this.currentRule = $rule;
        return this[ruleName]($data);
    }

    /**
     * run all the rules on the given $query
     * @param string $query
     */
    runAllRules($query) {
        let $rulesToRun = this.getRulesToRun();
        let $errors = [];
        let $result = {};
        for(let i=0; i<$rulesToRun.length; i++) {
            let $rule = $rulesToRun[i];
            try {
                this.runRule($rule.name, $query);
            } catch (errorMessage) {
                let errorMeta = {
                    "message": errorMessage
                };
                if($rule.type === 'WARNING') {
                    errorMeta.type = 'WARNING';
                }
                $errors.push(errorMeta);               //there was some exception thrown and this must be logged
            }
        }

        $result['errors'] = $errors;
        if($errors.length === 0) {
            $result['success'] = {
                "message": "All rules passed." + $query.getValue()
            };
        }
        return $result;
    }

    /**
     * check that the tablespace is valid for the create table statement
     * @param $query
     */
    createTableHasValidTablespace($query) {
        if($query.contains("create table") === true) {
            // this is a create table statement, now we need to check that a tablespace is specified
            if($query.contains("tablespace") === false) {
                this.handleError($query);
            } else {
                // the tablespace must be one of ACCTDATA, ACCTIMS, IAAUDITDATA and ACCTGLOBDATA
                // IAAUDITDATA missing in documentation
                if($query.containsOneOf(["ACCTDATA", "ACCTIMS", "ACCTGLOBDATA", "IAAUDITDATA"]) !== true) {
                    this.handleError($query);
                }
            }
        }
    }

    /**
     * check that the tablespace is valid for the create table statement
     * @param $query
     */
    createIndexHasValidTablespace($query) {
        if($query.contains("create index") === true) {
            // this is a create index statement, now we need to check that a tablespace is specified
            if($query.contains("tablespace") !== true) {
                this.handleError($query);
            } else {
                // the tablespace must be one of ACCTINDX, ACCTGLOBINDX, and IAAUDITINDX
                // should there be one for IMS?? missing in documentation
                if($query.containsOneOf(['ACCTINDX', 'ACCTGLOBINDX', 'IAAUDITINDX']) !== true) {
                    this.handleError($query);
                }
            }
        }
    }

    /**
     * temp tables must start with temp_
     * @param $query
     */
    hasValidTempTableName($query) {
        if($query.contains("create temporary table") === true) {
            let $tableName = $query.getNextWord("create temporary table");
            if($tableName.toLowerCase().startsWith("temp_") === false) {
                this.handleError($query);
            }
        }

        //temp tables might be created by creating a table and deleting it within the script
        if($query.contains("create table") === true) {
            let $tableName = $query.getNextWord("create table");
            if(this.allQueries.contains(`drop table ${$tableName}`) === true) {
                if($tableName.toLowerCase().startsWith("temp_") === false) {
                    this.handleError($query);
                }
            }
        }
    }

    /**
     * the query must not contain double quotes
     * @param $query
     */
    hasDoubleQuotes($query) {
        if($query.getValue().indexOf('"') !== -1) {
            this.handleError($query);
        }
    }

    /**
     * will check if we are adding a new constraint and validate against different constraint naming conventions
     * @param $query
     */
    hasValidContraintNames($query) {
        let $constraintNamingConventions = [
            {
                "type": "Check constraint",
                "regex": "ALTER TABLE(.*)ADD CONSTRAINT\\s+(CK_.*)\\s+CHECK\\s*\\(\\s*(\\S+)\\s+.*$",
                "format": "CK_<TABLE_NAME>_<COLUMN_NAME>",
            },
            {
                "type": "Foreign key constraint",
                "regex": "ALTER TABLE(.*)ADD CONSTRAINT\\s+(.*)\\s+FOREIGN KEY\\s*\\(.*\\,\\s+(\\S+)\\)\\s+.*REFERENCES.*$",
                "format": "FK_<TABLE_NAME>_<COLUMN_NAME>",
            },
            {
                "type": "Primary key constraint1",
                "regex": "ALTER TABLE(.*)ADD CONSTRAINT\\s+(.*)\\s+PRIMARY KEY\\s*\\(.*\\,\\s+(\\S+)\\)\\s+.*REFERENCES.*$",
                "format": "PK_<TABLE_NAME>",
            },
            {
                "type": "Unique key constraint2",
                "regex": "ALTER TABLE(.*)ADD CONSTRAINT\\s+(.*)\\s+UNIQUE\\\\s*\\\\(.*\\\\,\\\\s+(\\\\S+)\\\\)\\\\s+.*REFERENCES.*$",
                "format": "UQ_<TABLE_NAME>_<COLUMN_NAME>",
            },
            {
                "type": "NOT NULL constraint1",
                "regex": "ALTER TABLE(.*)ADD CONSTRAINT\\s+(NN_.*)\\s+CHECK\\s*\\(\\s*(\\S+)\\s+.*$",
                "format": "NN_<TABLE_NAME>_<COLUMN_NAME>",
            },
            //it is possible to add the constraints directly when creating the table, so need to check for that too
        ];

        for (let i=0; i<$constraintNamingConventions.length; i++) {
            let $constraintNamingConvention = $constraintNamingConventions[i];
            let $regexp = new RegExp($constraintNamingConvention.regex, 'gmi');
            let $matches = $regexp.exec($query.getValue());
            if($matches !== null) {
                let $tableName = $matches[1].trim();
                let $nameFormat = $constraintNamingConvention.format;

                let $columnName = "";
                if(typeof $matches[3] !== 'undefined') {
                    $columnName = $matches[3].trim();
                }

                let $formedContraintName = this.getFormedConstraintName($nameFormat, $tableName, $columnName);
                let $constraintName = $matches[2].trim();
                if($formedContraintName.indexOf($constraintName) === -1) {
                    this.currentRule.error += ` Fails test for ${$constraintNamingConvention.type}, format should be ${$constraintNamingConvention.format}.`;
                    this.handleError($query);
                }
            }
        }
    }

    /**
     * create a contraint name based on the format and return it
     * @param $nameFormat
     * @param $tableName
     * @returns {*}
     */
    getFormedConstraintName($nameFormat, $tableName, $columnName) {
        let $formedContraintName = $nameFormat.replace("<TABLE_NAME>", $tableName);
        $formedContraintName = $formedContraintName.replace("<COLUMN_NAME>", $columnName);
        return $formedContraintName;
    }


    /**
     * there is some error in the query, so we need to log it
     * @param $query
     */
    handleError($query) {
        let error = `${this.currentRule.name} failed for ${$query.getValue()}`;
        if(typeof this.currentRule.error !== 'undefined') {
            error = this.currentRule.error;
        }
        throw error;
    }
};
