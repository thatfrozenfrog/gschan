// gschan/reply.js — Reply UI: opening reply mode and managing the reply prefix

export function openReply(postNumber, name, { replyInput, replyingTextEl, replyingTextLabel, textInput, inputDiv }) {
    const targetValue = String(postNumber);
    const replyPrefix = `>>${targetValue}\n`;

    if (replyInput.value !== targetValue) {
        replyingTextEl.textContent = `${replyingTextLabel} No.${targetValue} (${name})`;
        replyInput.value = targetValue;
        replyingTextEl.style.display = 'block';
        setReplyPrefix(replyPrefix, textInput);
    } else {
        replyingTextEl.textContent = '';
        replyInput.value = '';
        replyingTextEl.style.display = 'none';
        setReplyPrefix('', textInput);
    }

    if (inputDiv) {
        inputDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (textInput) {
        textInput.focus();
        textInput.setSelectionRange(textInput.value.length, textInput.value.length);
    }
}

export function setReplyPrefix(nextPrefix, textInput) {
    if (!textInput) { return }

    const currentPrefix = textInput.dataset.replyPrefix || '';
    if (currentPrefix && textInput.value.startsWith(currentPrefix)) {
        textInput.value = textInput.value.slice(currentPrefix.length);
    }

    if (nextPrefix) {
        textInput.value = `${nextPrefix}${textInput.value}`;
    }

    textInput.dataset.replyPrefix = nextPrefix;
}
