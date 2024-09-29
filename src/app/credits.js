function creditsForm(stage, result) {
	if (stage == "postfetch") {
		if (result.text == "success") {
			window.location.href = result.redirect
		} else {
			invalid_modal.showModal()
		}
	}

	return result
}
