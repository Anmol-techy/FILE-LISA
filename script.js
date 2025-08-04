let socket;
window.addEventListener('load', () => {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${protocol}://${location.host}`);

  socket.onopen = () => {
    if (location.pathname.includes("receive")) {
      socket.send(JSON.stringify({ type: "registerReceiver" }));
    }
  };

  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "receiverList" && document.getElementById("userList")) {
      const usersEl = document.getElementById("users");
      usersEl.innerHTML = "";
      data.users.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user;
        li.onclick = () => sendFileTo(user);
        usersEl.appendChild(li);
      });
      document.getElementById("userList").style.display = "block";
    }

    if (data.type === "incomingFile" && document.getElementById("incoming")) {
      const link = document.createElement("a");
      link.href = data.file;
      link.download = data.filename;
      link.textContent = `Download ${data.filename}`;
      document.getElementById("incoming").appendChild(link);
      document.getElementById("incoming").appendChild(document.createElement("br"));
    }
  };
});

function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const files = fileInput.files;
  if (!files.length) return alert("Please select at least one file");

  const promises = Array.from(files).map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ name: file.name, data: reader.result });
      };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(promises).then(fileDataArray => {
    window._fileDataArray = fileDataArray;
    socket.send(JSON.stringify({ type: "getReceivers" }));
  });
}

function sendFileTo(userId) {
  if (!window._fileDataArray || !window._fileDataArray.length) return alert("No files uploaded");
  socket.send(JSON.stringify({
    type: "sendFile",
    to: userId,
    files: window._fileDataArray
  }));
  alert("Files sent to " + userId);
}
