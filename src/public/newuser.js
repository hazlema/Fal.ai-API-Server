function loginForm(stage, result) {
	if (stage == "postfetch") {
		if (result.text == "success") {
			window.location.href = result.redirect
		} else {
			invalid_modal.showModal()
		}
	}

	return result;
}

document.addEventListener("DOMContentLoaded", function () {
	document.getElementById("confirm").addEventListener("keyup", (e) => {
		if (document.getElementById("password").value != document.getElementById("confirm").value) {
			document.getElementById("submit").disabled = true
		} else {
			document.getElementById("submit").disabled = false
		}
	})
})
