/**
 * @author Pinaki Das <pinaki.das@sage.com>
 * @copyright 2022 Intacct Corporation All, Rights Reserved
 */

'use strict'

class Query {
    /**
     * @param string $query
     */
    constructor($query) {
        this.value = $query.replace(/\n/g, ' ');         //remove the \n as they screw the regex
    }

    /**
     * getter
     * @returns string
     */
    getValue() {
        return this.value;
    }

    /**
     * check if the string contains the given substring
     * @param string $query
     * @param string $searchString
     */
    contains($searchString) {
        let $searchRegex = this.convertToRegex($searchString);
        let $matches = $searchRegex.exec(this.value);
        if($matches === null) {
            return false;
        } else {
            // if we get more than one match, do we need to raise a concern flag?
            return true;
        }
    }

    /**
     * add \s* between spaces in the given string and return as regex
     * @param $searchString
     */
    convertToRegex($searchString) {
        //we add a space to the end of the string to match it exactly
        //not added to the start since it can be the first character in the string, need to do a lookahead later
        $searchString = `${$searchString} `;
        //matching ends when we find a space, or a / or the end of the line
        let $regex = $searchString.replace(/ /g, "(\\s+|\/|$)");
        $regex = new RegExp($regex, 'gmi');
        return $regex;
    }

    /**
     * check if the query contains any of the given values from the search array
     * @param $searchArray
     */
    containsOneOf($searchArray) {
        for(let i=0; i<$searchArray.length; i++) {
            if(this.contains($searchArray[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * get next word in the query after the given string
     * @param string $string
     */
    getNextWord($string) {
        let regex = new RegExp(`${$string}\\s+(\\S+)`, 'gmi');
        let matches = regex.exec(this.value);
        if(matches === null) {
            return null;
        }
        return matches[1];
    }
}