/******************************************************************************
 * Copyright © 2013-2016 The Nxt Core Developers.                             *
 * Copyright © 2016-2018 Jelurida IP B.V.                                     *
 *                                                                            *
 * See the LICENSE.txt file at the top-level directory of this distribution   *
 * for licensing information.                                                 *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement with Jelurida B.V.,*
 * no part of this software, including this file, may be copied, modified,    *
 * propagated, or distributed except according to the terms contained in the  *
 * LICENSE.txt file.                                                          *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/

/**
 * @depends {nrs.js}
 */
var NRS = (function (NRS, $, undefined) {

  NRS.pages.p_sigbro_main = function () {
    var rows = "";

    NRS.sendRequest("getBlockchainStatus", {}, function (response) {
      if (response.lastBlock != undefined) {
        $.each(response, function (fieldName, value) {
          rows += "<tr>";
          rows += "<td>" + String(fieldName).escapeHTML() + "</td>";
          if (fieldName == "lastBlockchainFeederHeight" && value) {
            //Making use of existing client modals and functionality
            var valueHTML = "<a href='#' data-block='" + String(value).escapeHTML() + "' class='show_block_modal_action'>";
            valueHTML += String(value).escapeHTML() + "</a>";
          } else {
            var valueHTML = String(value).escapeHTML();
          }

          rows += "<td>" + valueHTML + "</td>";
          rows += "</tr>";
        });
      }
      NRS.dataLoaded(rows);
    });
  }

  function isJSON(str) { try { JSON.parse(str); } catch (e) { return false; } return true; }

  NRS.setup.p_sigbro_main = function () {

    $('#send_money_do_not_broadcast').prop('checked', true);
    $('#send_message_do_not_broadcast').prop('checked', true);
    $('#send_money_do_not_sign').prop('checked', true);
    $('#send_message_do_not_sign').prop('checked', true);

    $('.secret_phrase').remove();

    var findJSON;
    var send = 0;

    // raw_transaction_modal_transaction_json_download

    findJSON = setInterval(function () {
      // if send > 0 and we already close modal form - let's clear counter
      var raw_tx = $('#raw_transaction_modal').css('display');
      if ( send > 0 && raw_tx == 'none' ) { 
        NRS.logConsole("Sigbro :: Waiting for the transaction");
        $('#raw_transaction_modal_transaction_json').html('');
        $('#raw_transaction_modal_unsigned_bytes_qr_code_container').html('');
        send = 0; 
      }

      // looking for #raw_transaction_modal_transaction_json 
      var unsignJSON = $('#raw_transaction_modal_transaction_json').val();
      if (unsignJSON.length > 100) {

        if (send > 0) {
          // stop looking for json if we already find it
          return;
        }
        send++;

        // in raw_transaction_modal_transaction_json_download we can find url to unsigned json
        var url_to_unsigned_json = $('#raw_transaction_modal_transaction_json_download').attr("href");

        $.ajax
          ({
            type: "GET",
            url: url_to_unsigned_json,
            dataType: "json",
            contentType: "application/json",
            async: false,
            success: function (response) {
              // check response
              if (response) {

                var save_tx_url = "https://random.api.nxter.org/api/v3/save_tx";
                var unsigned_json = {};

                var unsigned_bytes = $('#raw_transaction_modal_unsigned_transaction_bytes').val();

                unsigned_json["transactionJSON"] = response;
                unsigned_json["unsignedTransactionBytes"] = unsigned_bytes;
                
                //console.log("----------debug-----------");
                //console.log(unsigned_json);
                //console.log("^^^^^^^^^^^^^ debug ^^^^^^^^^^^^^^^");

                // sending POST to API
                $.ajax
                  ({
                    type: "POST",
                    url: save_tx_url,
                    dataType: 'json',
                    contentType: "application/json",
                    async: false,
                    data: JSON.stringify(unsigned_json),
                    success: function (response) {
                      console.log("----------debug-----------");
                      console.log(response);
                      console.log("^^^^^^^^^^^^^ debug ^^^^^^^^^^^^^^^");

                      if (response.uuid) {
                        // rewrite div with QR code
                        $('#raw_transaction_modal_unsigned_bytes_qr_code_container').html('<strong>SIGBRO QR CODE</strong><div id="raw_transaction_modal_sigbro_qr_code"></div>');

                        tx_url = "https://dl.sigbro.com/" + response.uuid + "/";
                        console.log("----------debug-----------");
                        console.log(tx_url);
                        console.log("^^^^^^^^^^^^^ debug ^^^^^^^^^^^^^^^");

                        var type = 2;
                        var cellSize = 4;
                        while (type <= 40) {
                          try {
                            var qr = qrcode(type, 'M');
                            qr.addData(tx_url);
                            qr.make();
                            var img = qr.createImgTag(cellSize);
                            NRS.logConsole("Encoded QR code of type " + type + " with cell size " + cellSize);
                            $('#raw_transaction_modal_sigbro_qr_code').empty().append(img);
                            return img;
                          } catch (e) {
                            NRS.logConsole("Try to encode QR code with type " + type);
                            type++;
                          }
                        }
                      } else {
                        // can not save json. 
                        alert('Sorry. Sigbro can not generate QR code for the transaction. Write us, please.');
                        NRS.logConsole("Sorry. Sigbro can not generate QR code for the transaction. Write us, please.");
                        return 2;
                      }

                    } // end success on POST resquest
                  });

              } else {
                alert('Can not decode unsigned transaction. Sorry');
                return 2;
              }
            } // end success on GET request

          });

      } // end of IF for checking if div already shown on the main form
    }, 500);
  }

  return NRS;
}(NRS || {}, jQuery));

//File name for debugging (Chrome/Firefox)
//@ sourceURL=nrs.sigbro_main.js
