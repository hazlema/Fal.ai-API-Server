/**
 * ajax.js, by Frosty - 9/27/24
 * 
 * Handles the submission of a form by preventing the default behavior, 
 * extracting the form data, converting types automatically, checking
 * for any prefetch and postfetch commands and sending it to the specified 
 * action URL.
 * 
 * Be careful with prefetch a bad actor could inject data or exploit 
 * something.
 * 
 * Supports: 
 * 		input text, input number, input range, input checkbox, 
 * 		input radio, select, textarea
 * 
 * Supported conversions: 
 * 		string -> string, string -> int, string -> float
 * 		string -> boolean
 *   
 * You can hide data from being sent with the "--skip-data" attribute.
 * 
 * Example usage:
 *
 * function form(stage, content) {
 *   if (stage == 'prefetch')
 *     return { ...content, add: 'added' }	// Format / add data
 * 
 *   if (stage == 'postfetch') 
 *     console.log(content);				// Resulting Data
 *  }
 * 
 * <form id="form" fetch="true" action="/data" method="POST">
 *   <input type="text" name="name" value="John Doe" />
 *   <input type="number" name="age" value="32" />
 *   <input --skip-data type="number" name="secret" value="52" />
 *   <select name="opts" />
 *   	<option value="opt 1" selected>Opt 1</option>
 *   	<option value="opt 2">Opt 2</option>
 *   </select>
 *   <button type="submit">Submit</button>
*/

/**
 * Sends a POST request to the specified URL with the provided content.
 * 
 * @param {object} content - The data to be sent in the request body.
 * @param {string} url - The URL to which the request is to be sent.
 * 
 * @returns {object} - A JSON object representing the server's response, or an error object if the request fails.
 */
async function postData(content, url) {
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(content),
		});
		return await response.json();
	} catch (error) {
		console.error('Error:', error);
		return { error: 'An error occurred while processing your request.' };
	}
}

/**
 * Checks if a function with the given name exists in the global `window` object.
 * 
 * @param {string} functionName - The name of the function to check.
 * @returns {boolean} - Returns `true` if the function exists, `false` otherwise.
 */
function hasFunc(functionName) {
	return typeof window[functionName] === 'function';
}

/**
 * Retrieves form data with typed values from the given form name.
 * 
 * @param {string} formName - The ID of the form to retrieve data from.
 * @returns {object} An object containing the form data with typed values.
 */
function formDataWithTypes(formName) {
	const form = document.querySelector('#' + formName);
	if (!form) throw new Error(`Form with id '${formName}' not found`);

	const elements = form.querySelectorAll("input, select, textarea");

	function getAllAttr(ele) {
		const attrFromElement = Array.from(ele.attributes).map(attr => attr.name.toLowerCase());
		const protoProps = Object.getOwnPropertyNames(ele.__proto__).concat(Object.keys(ele));
		return new Set([...attrFromElement, ...protoProps]);
	}

	return Array.from(elements).reduce((output, ele) => {
		const attr = getAllAttr(ele);

		if (!attr.has("--skip-data") && attr.has("value") && attr.has("name")) {
			let value = ele.value;

			if (attr.has("type")) {
				switch (ele.type) {
					case "number":
					case "range":
						if (value.indexOf(".") > 0) {
							value = parseFloat(value);
						} else {
							value = parseInt(value, 10);
						}
						break;
					case "checkbox":
						value = attr.has("checked") && ele.checked;
						break;
				}
			}

			output[ele.name] = value;
		}

		return output;
	}, {});
}

/**
 * Handles the submission of a form by preventing the default behavior, 
 * extracting the form data, and sending it to the specified action URL.
 * 
 * @param {Event} form - The form submission event.
 * @returns {Promise<void>}
 */
async function processForm(form) {
	form.preventDefault();
	const { action, id } = form.target;
	let formObject = formDataWithTypes(id);

	if (action && id) {
	 	if (hasFunc(id))
	 		formObject = await window[id]('prefetch', formObject);

		const result = await postData(formObject, action);

		if (hasFunc(id))
			await window[id]('postfetch', result);
	} else {
		console.error('Fetch form missing ID or Action');
	}
}

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('form[fetch="true"]').forEach((form) => {
		form.addEventListener('submit', processForm);
	});
});