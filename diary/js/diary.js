var map;

function UrlExists(url)
{
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}


var	dataDiary = [];
var user = "demo1";

var prev = null;
var curr = null;
var next = null;

function init() {
	function split( val ) {
	      return val.split( /,\s*/ );
	}
	
	$("#tags").autocomplete(
			{
				delay: 0,
				minLength: 2,
				source : '/mha/tags',
				open: function(){
			        setTimeout(function () {
			            $('.ui-autocomplete').css('z-index', 99999999999999);
			        }, 0);
			    },
				select: function( event, ui ) {
			          var terms = split( this.value );
			          // remove the current input
			          terms.pop();
			          // add the selected item
			          terms.push( ui.item.value );
			          // add placeholder to get the comma-and-space at the end
			          terms.push( "" );
			          this.value = terms.join( "," );
			          return false;
			        }
			});	
	

	$('#start_date').datetimepicker(
		{

		defaultDate: "+lw",
		dateFormat: 'yy-mm-dd',
		timeFormat: "HH:mm:ss",
		changeMonth: true,
		numberOfMonths: 1,
		ampm: true,
		stepMinute: 5,
		minuteGrid: 10,

		}
	);


	$('#end_date').datetimepicker(
		{

		defaultDate: "+lw",
		dateFormat: 'yy-mm-dd',
		timeFormat: "HH:mm:ss",
		changeMonth: true,
		numberOfMonths: 1,
		ampm: true,
		stepMinute: 5,
		minuteGrid: 10,

		}
	);


    scheduler.config.multi_day = true;
    scheduler.config.xml_date = "%Y-%m-%d %H:%i";
    scheduler.config.details_on_dblclick = true;
    scheduler.config.details_on_create = true;
    scheduler.config.full_day = true;

    scheduler.init("scheduler_here", new Date(), "month");

    scheduler.attachEvent("onClick", function(id, e) {

        scheduler._on_dbl_click(e);
      
      return false;
      });


    var setter = scheduler._click.dhx_cal_data;

    scheduler._click.dhx_cal_data = function(e) {

        if (!scheduler._locate_event(e ? e.target : event.srcElement)) {
        scheduler._on_dbl_click(e || event);
        }
        setter.apply(this, arguments);
    };


	scheduler.data_attributes = function(){
	    return [
	        ["id"],["text"],["start_date"],["end_date"],
	        ["details"], ["location"], ["tags"], ["valueItems"]
	    ];
	};

       
        $.when(top.mha.data.diary)
            .done(function(diaryData) {
              

                var data = [ ];
                
                if (diaryData && diaryData[1] == "success") {
                    var diaryDataset = diaryData[0];
                    if (typeof diaryDataset == 'string' || diaryDataset instanceof String) {
                        diaryDataset = JSON.parse(diaryDataset);
                    }

                    dataDiary = HandleDiaryData(diaryDataset);
                    data = data.concat(dataDiary);
                }


                scheduler.setCurrentView(scheduler._date, scheduler._mode);

           });

}

function HandleDiaryData(data)
{
	console.log("Diary data length: " + data.length);

	var outData = [];

	for (var i = 0; i < data.length; i++)
	{
		if (typeof data[i].start_date == 'undefined' )
			continue;

		if (data[i].start_date == null) 
			continue;

		var item = data[i];
		item.type = "diary";
		item.color = "coral";
		item.textColor = "white";

		outData.push(data[i]);
	}

     
	return outData;
}


scheduler.showLightbox = function (id) {
    var ev = scheduler.getEvent(id);

    var start_time_str = formatDate(ev.start_date, "yyyy-MM-dd HH:mm:ss");
    var end_time_str = formatDate(ev.end_date, "yyyy-MM-dd HH:mm:ss");
    var innerHTML = '<p>' + ev.text + ' ' + start_time_str + ' - ' +  end_time_str + '</p>';
    document.getElementById('event_title').innerHTML = innerHTML;

	if (typeof ev.type === 'undefined' || ( typeof ev.type != 'undefined' && ev.type === "diary") ) {

	    scheduler.startLightbox(id, document.getElementById("event_form"));
	    document.getElementById("text").value = ev.text;
	    document.getElementById("start_date").value = start_time_str;
	    document.getElementById("end_date").value = end_time_str;     


	    document.getElementById("location").value = ev.location || "";
	    document.getElementById("tags").value = ev.tags || "";
	    document.getElementById("details").value = ev.details || "";
	    //$("#sharing").value = ev.sharing || "";

	    document.getElementById("text").focus();
      
	    
	} 
	
}

