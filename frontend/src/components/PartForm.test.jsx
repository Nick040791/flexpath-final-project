/** Test 1: initial state 
 * Verify:
 *  name empty
 *  category empty
 *  price empty
 *  public checked 
 *  the component defaults is_Public to true
*/

/** Test 2: Valid populated form
 * Verify:
 * Name RTX 4070 Super
 * Brand NVIDIA
 * Model: 4070 Super
 * Price: 599.99
 * Description: 1440p GPU
 * Public: false
 *  onSubmit should be called with the correct parameters -> expected:
 * {
    name: "RTX 4070 Super",
    category: "GPU",
    brand: "NVIDIA",
    model: "4070 Super",
    price: 599.99,
    description: "1440p GPU",
    is_Public: false
 * input value = "599.99"
 * submitted value = 599.99
 *
 * we are testing the Number(form.price) behavior in the component.
 * }
 */

/** Test 3: Optional Fields
* Use valid:
 * name
 * category
 * but leave:
 *  brand
 *  model
 *  price
 *  description
 * empty.
*Expected:
 * brand: null
 * model: null
 * price: null
 * description: null
*/

/**Test 4: Edit State 
 * Pass an initial object.
 * Verify its values populate the form.
 * This covers:
 *  ...initial
 *  and:
 *  price: initial?.price ?? ""
*/

/** Test 5: Submitting State 
 * With:
 *  submitting={true}
 * Verify:
 *  button disabled
 *  button text = Saving...
 */

/** Test 6: Cancel

 * Supply: onCancel
 * click: Cancel
 * and verify callback executed.
 */


