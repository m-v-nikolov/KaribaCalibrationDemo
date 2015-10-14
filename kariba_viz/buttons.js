var rounds_by_name = {
    "2012Round1": 0,
    "2012Round2": 1,
    "2012Round3": 2,
    "2013Round1": 3,
    "2013Round2": 4,
    "2013Round3": 5,
    "2014Round1": 6,
    "2014Round2": 7,
    "2014Round3": 8,
}

$(document).ready(function () {
    $(".cb").click(function () {
        var parent = $(this).parents('.switch');
        $('.cb', parent).removeClass('selected');
        $(this).addClass('selected');

        var round = $(this).attr('for');
        update_RDT_array_idx(rounds_by_name[round]);

    });
});