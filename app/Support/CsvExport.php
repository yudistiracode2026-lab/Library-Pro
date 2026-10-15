<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CSV that opens cleanly in Excel with Indonesian regional settings:
 * UTF-8 BOM so accents survive, and ";" because "," is the decimal mark.
 */
class CsvExport
{
    /**
     * @param  list<string>  $headers
     * @param  iterable<array<int, mixed>>  $rows
     */
    public static function download(string $name, array $headers, iterable $rows): StreamedResponse
    {
        $filename = $name.'-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($headers, $rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers, ';');

            foreach ($rows as $row) {
                fputcsv($out, $row, ';');
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
