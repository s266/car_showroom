function getVariantPrice(variant_id,city){
        $.ajax({
            type: "get",
            url: lang + "/finance/getvariantprice",
            data: {variant_id: variant_id,city:city},
            success: function (data) {
                var price = parseInt(data.exshowroomprice);
                
               $("#variant_price_val").val(price.toLocaleString("en-IN"));
               $("#variant_price").val(data.exshowroomprice);
               $("#finance-model_id").val(data.model_id);
               setCarAmount(data.exshowroomprice);
            }
        });
    }
    
    function setCarAmount(exshowroom_price) {
        var firstdownpayment = Math.round(exshowroom_price * 10/100);
        $(".downpayment_val").val(firstdownpayment);
        $(".downpayment").html(firstdownpayment.toLocaleString("en-IN"));
        calculateEmi(firstdownpayment,$(".intrest_rate_val").text(),parseInt($(".loan_period_val").text()));
        
        $( ".downpayment_slider" ).slider({
            range: 'min',
            min: 0,
            max: exshowroom_price,
            value: firstdownpayment,
           /// values:[0],
            slide: function( event, ui ) {
                $(".downpayment").html(ui.value.toLocaleString("en-IN"));
               $(".downpayment_val").val(ui.value);
                var downPayment =  $(".downpayment_val").val();
                var intrestRate = $(".intrest_rate_val").text();
                var loanPeriod = parseInt($(".loan_period_val").text());
                calculateEmi(downPayment,intrestRate,loanPeriod);
            },
            change: function(event, ui) {}
        });
    }
  
    $( ".intrest_rate_slider" ).slider({
        range: 'min',
        min: 800,
        max: 2200,
        step:1,
        value:800,
        //values: [ 8],
        slide: function( event, ui ) {
            $( ".intrest_rate_val" ).html(  ui.value/100);
            var downPayment = $(".downpayment_val").val();
            var intrestRate = $(".intrest_rate_val").text();
            var loanPeriod = parseInt($(".loan_period_val").text());
            calculateEmi(downPayment,intrestRate,loanPeriod);
        },
        change: function(event, ui) {}
    });
    
    $( ".loan_slider" ).slider({
        range: 'min',
        min: 12,
        max: 84,
        step:12,
        value: 12,
        slide: function( event, ui ) {
            $( ".loan_period_val" ).text(  ui.value +' Months');
            var downPayment = $(".downpayment_val").val();
            var intrestRate = $(".intrest_rate_val").text();
            var loanPeriod = parseInt($(".loan_period_val").text());
            calculateEmi(downPayment,intrestRate,loanPeriod);
        },
        change: function(event, ui) {}
    })

    function calculateEmi(downPayment,intrestRate,loanPeriod){
        if(downPayment != undefined && intrestRate != undefined && loanPeriod != undefined){
            
            var loanamount = $("#variant_price").val() - downPayment;
            
            var monthlyamount = ((intrestRate /(100 * 12)) * loanamount) / (1 - Math.pow(1 + intrestRate / 1200,  (-loanPeriod)));
            var emi =  Math.round(monthlyamount);
            
            $("#emi").html("<i class=\"rupee\">Rs. </i>" + emi.toLocaleString("en-IN"));
            $("#emi_val").val(emi);
            var emi_val = $("#emi_val").val();
            
            var total_amount = emi_val*loanPeriod;
            var total_interest = total_amount - loanamount;
            $(".principal_val").html("<i class=\"rupee\">Rs. </i>" + loanamount.toLocaleString("en-IN"));
            $(".total_interest").html("<i class=\"rupee\">Rs. </i>" + total_interest.toLocaleString("en-IN"));
            $(".total_amount").html("<i class=\"rupee\">Rs. </i>" + total_amount.toLocaleString("en-IN"));
            
            var loan_years = loanPeriod/12;
            $("#finance-loan_amount").val(loanamount);
            $("#finance-loan_duration_years").val(loan_years);
            drawChart(loanamount,total_interest,total_amount,parseInt(downPayment));
           
        }
    }
        