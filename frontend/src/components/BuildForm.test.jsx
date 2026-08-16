/**Test 1: Defaults 
 * name = ""
 * description = ""
 * Public = true
*/

/**Test 2: Submission 
 * Fill:
 *  Name: Budget Gaming PC
 *  Description: Gaming build under $1000
 *  Public: false
 * Expected callback:
 *  {
 *    name: "Budget Gaming PC",
 *    description: "Gaming build under $1000",
 *    is_Public: false
 *  }
 */

/**Test 3: Blank Description 
* description = "" should become:
*   description: null  
 */

/**Test 4: Cancel/Edit/Submit Behavior 
 *Verify:
 *  initial values populate
 *  Cancel invokes onCancel
 *  submitting disables Save
 *  submitting displays Saving...
 */
