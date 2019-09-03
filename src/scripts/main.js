$("#collapse-one").on("show.bs.collapse", function () {
  $("#arrow-one").css("transform", "rotate(-135deg)");
  $("#arrow-one").css("webkitTransform", "rotate(-135deg)");
});

$("#collapse-two").on("show.bs.collapse", function () {
  $("#arrow-two").css("transform", "rotate(-135deg)");
  $("#arrow-two").css("webkitTransform", "rotate(-135deg)");
});

$("#collapse-one").on("hide.bs.collapse", function () {
  $("#arrow-one").css("transform", "rotate(45deg)");
  $("#arrow-one").css("webkitTransform", "rotate(45deg)");
});

$("#collapse-two").on("hide.bs.collapse", function () {
  $("#arrow-two").css("transform", "rotate(45deg)");
  $("#arrow-two").css("webkitTransform", "rotate(45deg)");
});
