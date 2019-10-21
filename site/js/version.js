function launch_version(hash) {
    $.ajax({
        url: '/version',
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