(function($, acf) {

  /**
   * [getAcfPostData description]
   */
  function getAcfPostData(postID, $parent) {

    var reqData = {
      'action':         'get_acf_post_meta',
      'post_id':        postID,
      'acf_field_keys': []
    };

    $parent.find('[data-acf-field-key]').each(function() {
      var $this = $(this);
      reqData.acf_field_keys.push($this.data('acf-field-key'));
      $this.prop('readonly', true);
    });

    $.post(
      ajaxurl,
      reqData,
      function(result) {

        var keys = [];
        $parent.find('[data-acf-field-key]').each(function() {
          keys.push($(this).data('acf-field-key'));
        });

        for (var i = 0; i < keys.length; i++) {
          var key   = keys[i];
          var value = result[key];

          if (typeof(value) === 'boolean') {
            value *= 1;
          }

          // Remove readonly prop
          $('input[data-acf-field-key="' + key + '"]').prop('readonly', false);

          // Set text field values
          $('input[type!="radio"][data-acf-field-key="' + key + '"]').val(value);

          // Set val for radio buttons
          var $selected = $('.acf-radio-list[data-acf-field-key="' + key + '"]').find('[value="' + value + '"]').prop('checked', true);
          if (!$selected.length) {
            if (!!value) {
              $('.acf-radio-list.other[data-acf-field-key="' + key + '"]').find('[value="other"]').prop('checked', true);
            } else {
              $('.acf-radio-list.other[data-acf-field-key="' + key + '"]').find('[type="text"]').val('');
            }
          }
        }
      }
    );

  }

  /**
   * Override the WP inline edit post function to populate
   * the custom ACF fields.
   */
  var nativeInlineEdit = inlineEditPost.edit;
  inlineEditPost.edit = function(id) {

    nativeInlineEdit.apply(this, arguments);

    var postID = 0;
    if (typeof(id) === 'object') {
      postID = parseInt(this.getId(id), 10);
    }

    getAcfPostData(postID, $('.inline-edit-row'));
  };

  /**
   * [description]
   */
  $(document).on('click.bulkAction', '.bulkactions .button.action', function() {

    var postIDs = [];
    var reqData = {
      'action':         'get_acf_post_meta',
      'post_id':        false,
      'post_ids':       [],
      'acf_field_keys': []
    }

    $('#bulk-edit #bulk-titles').children().each(function() {
      postIDs.push($(this).attr('id').replace(/^(ttle)/i, ''));
    });

    getAcfPostData(postIDs, $('#bulk-edit'));
  });

  /**
   * [description]
   */
  $(document).on('change.acfRadio', '.acf-radio-list.other input[type="radio"]', function() {
    var $this = $(this);
    var $list = $this.closest('.acf-radio-list');
    $list.find('[type="text"]').prop('disabled', $this.val() !== 'other');
  });

  /**
   * Update datepicker value.
   *
   * inlineEditPost duplicates the fields and the ones that are updated by the
   * instantiated datepicker aren't the visible ones.
   * So I've made this to update those fields.
   *
   * @param  {$el}  DOM element.
   */
  acf.add_action('change', function($el) {

    // Bail out if it's not a datepicker
    if (!$el.hasClass('hasDatepicker')) {
      return false;
    }

    var key        = $el.data('acf-field-key');
    var $input     = $('.inline-edit-row').find('[data-acf-field-key="' + key + '"]');
    var dateFormat = $el.datepicker('option', 'dateFormat');
    var altFormat  = $el.datepicker('option', 'altFormat');
    var value      = $el.val();
    var date       = $.datepicker.parseDate(dateFormat, value);
    var $hidden    = $input.parent().find('input[type="hidden"]');

    $input.val($.datepicker.formatDate(dateFormat, date));
    $hidden.val($.datepicker.formatDate(altFormat, date));

  });

})(jQuery, acf);
