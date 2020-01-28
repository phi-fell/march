function launch_version(hash) {
    $.ajax({
        url: '/diagnostic/version',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            'hash': hash,
        }),
        success: (data) => {
            console.log(data);
            window.location.reload(true);
        },
        dataType: 'json',
    });
}

function refresh_versions() {
    $.ajax({
        url: '/diagnostic/version/refresh',
        type: 'POST',
        contentType: 'application/json',
        success: (data) => {
            console.log(data);
            window.location.reload(true);
        },
        dataType: 'json',
    });
}
