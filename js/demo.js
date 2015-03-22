$(function(){

  // for zepto
  function getScript(url, callback){
    $.ajax({
      url: url,
      dataType: "script",
      success: callback
    });
  }

  // for Modern Browsers
  if( "addEventListener" in document ){

    // fastclick
    getScript("vendor/fastclick/fastclick.js", function(){
      FastClick.attach(document.body);
    });

    // highlight
    getScript("vendor/highlight/highlight.pack.js", function(){
      $("pre code").each(function(i, block){
        hljs.highlightBlock(block);
      });
    });
  }


  // page controls
  $(".page-control-toggle").on("click", function(){
    $(this).blur().toggleClass("active");
    $(".page-controls").toggleClass("active");
  });

});