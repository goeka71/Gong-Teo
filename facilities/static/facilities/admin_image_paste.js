// 시설 어드민: 복사한 이미지를 화면에 붙여넣기(Ctrl/⌘+V)하면 이미지 파일 칸에 자동으로 채운다.
document.addEventListener("DOMContentLoaded", function () {
  var fileInput = document.querySelector('input[type="file"][name="image"]');
  if (!fileInput) return;

  var status = document.createElement("div");
  status.style.marginTop = "8px";
  fileInput.parentNode.appendChild(status);

  function showPreview(file) {
    status.textContent = "";
    var img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "붙여넣은 이미지 미리보기";
    img.style.cssText = "display:block;max-width:240px;max-height:240px;margin-bottom:4px;";
    var label = document.createElement("span");
    label.textContent =
      "붙여넣은 이미지 (" + Math.max(1, Math.round(file.size / 1024)) + "KB) - 저장하면 등록됩니다.";
    status.appendChild(img);
    status.appendChild(label);
  }

  document.addEventListener("paste", function (event) {
    var items = (event.clipboardData && event.clipboardData.files) || [];
    var file = Array.prototype.find.call(items, function (f) {
      return f.type.indexOf("image/") === 0;
    });
    if (!file) return;

    var transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    showPreview(file);
    event.preventDefault();
  });

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length) showPreview(fileInput.files[0]);
  });
});
