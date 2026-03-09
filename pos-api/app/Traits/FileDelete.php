<?php
namespace App\Traits;

use Illuminate\Support\Facades\File;

trait FileDelete
{
    /**
     * Delete a file from the specified path
     *
     * @param string $path
     * @param string|null $filename
     * @return bool
     */
    public function fileDelete($path, $filename)
    {
        if ($filename && $filename !== 'zinnia.jpg' && $filename !== 'default.png') {
            $file = $path . '/' . $filename;
            if (File::exists($file)) {
                return File::delete($file);
            }
        }
        return false;
    }
}
